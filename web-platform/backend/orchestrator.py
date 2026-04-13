import httpx
import os
import json
from dotenv import load_dotenv

load_dotenv()


class OrchestratorClient:

    def __init__(self):
        self.base_url     = os.getenv("ORCHESTRATOR_URL", "https://cloud.uipath.com")
        self.org_name     = os.getenv("UIPATH_ORG")
        self.tenant_name  = os.getenv("UIPATH_TENANT")
        self.client_id    = os.getenv("UIPATH_CLIENT_ID")
        self.client_secret = os.getenv("UIPATH_CLIENT_SECRET")
        self.folder_id    = os.getenv("UIPATH_FOLDER_ID")
        self.process_name = os.getenv("UIPATH_PROCESS_NAME", "ExpenseFlow")

    # ------------------------------------------------------------------
    # AUTENTICACAO
    # ------------------------------------------------------------------
    async def _get_token(self):
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
            self.base_url + "/identity_/connect/token",
            data={
                "grant_type":    "client_credentials",
                "client_id":     self.client_id,
                "client_secret": self.client_secret,
                "scope": "OR.Jobs OR.Jobs.Write OR.Folders OR.Folders.Read OR.Execution OR.Execution.Write",
            },
        )
        if response.status_code != 200:
            raise ValueError(
                f"Falha na autenticacao: {response.status_code} - {response.text}"
            )
        return response.json()["access_token"]

    # ------------------------------------------------------------------
    # HEADERS
    # ------------------------------------------------------------------
    def _headers(self, token):
        return {
            "Authorization":               f"Bearer {token}",
            "X-UIPATH-OrganizationUnitId": self.folder_id,
            "Content-Type":                "application/json",
        }

    # ------------------------------------------------------------------
    # BUSCAR RELEASE KEY DO PROCESSO
    # ------------------------------------------------------------------
    async def _get_release_key(self, token):
        url = (
            f"{self.base_url}/{self.org_name}/{self.tenant_name}"
            f"/orchestrator_/odata/Releases"
            f"?$filter=ProcessKey eq '{self.process_name}'"
            f"&$select=Key,ProcessKey,Name"
        )
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.get(url, headers=self._headers(token))
            response.raise_for_status()
            data = response.json()

        releases = data.get("value", [])
        print("[DEBUG] Releases encontradas:", json.dumps(releases, indent=2))

        if not releases:
            raise ValueError(
                f"Processo '{self.process_name}' nao encontrado na pasta {self.folder_id}"
            )

        return releases[0]["Key"]

    # ------------------------------------------------------------------
    # INICIAR JOB
    # ------------------------------------------------------------------
    async def start_job(self, connection_id: str):
        """
        Dispara o processo ExpenseFlow no Orchestrator.

        connection_id: UUID da conexao selecionada no frontend.
                       Vazio ("") = processar TODAS as contas do .env.
        """
        token       = await self._get_token()
        release_key = await self._get_release_key(token)
        input_args  = json.dumps({"in_ConnectionId": connection_id})

        modo = f"conta especifica [{connection_id}]" if connection_id else "TODAS as contas"
        print(f"[DEBUG] Modo: {modo}")
        print(f"[DEBUG] ReleaseKey: {release_key}")
        print(f"[DEBUG] FolderID:   {self.folder_id}")
        print(f"[DEBUG] InputArgs:  {input_args}")

        payload = {
            "startInfo": {
                "ReleaseKey":     release_key,
                "Strategy":       "ModernJobsCount",
                "JobsCount":      1,
                "RuntimeType":    "Unattended",   # ← correto para Serverless
                "InputArguments": input_args,
            }
        }

        url = (
            f"{self.base_url}/{self.org_name}/{self.tenant_name}"
            f"/orchestrator_/odata/Jobs/UiPath.Server.Configuration.OData.StartJobs"
        )

        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(url, json=payload, headers=self._headers(token))

        print(f"[DEBUG] Resposta Orchestrator: {response.status_code}")

        if response.status_code not in (200, 201):
            raise RuntimeError(
                f"Erro {response.status_code} ao iniciar job.\nResposta: {response.text}"
            )

        data = response.json()

        if not data.get("value"):
            raise RuntimeError("Orchestrator nao retornou dados do job.")

        job = data["value"][0]
        print(f"[DEBUG] Job criado: ID={job.get('Id')} | State={job.get('State')}")
        return job

    # ------------------------------------------------------------------
    # CONSULTAR STATUS DO JOB
    # ------------------------------------------------------------------
    async def get_job_status(self, job_id):
        token = await self._get_token()

        url = (
            f"{self.base_url}/{self.org_name}/{self.tenant_name}"
            f"/orchestrator_/odata/Jobs({job_id})"
            f"?$select=Id,State,StartTime,EndTime,Info,OutputArguments"
        )

        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.get(url, headers=self._headers(token))
            response.raise_for_status()
            data = response.json()

        STATE_MAP = {
            "Pending":    "Aguardando robo disponivel",
            "Running":    "Em execucao",
            "Stopping":   "Encerrando",
            "Stopped":    "Parado",
            "Successful": "Concluido com sucesso",
            "Faulted":    "Erro na execucao",
            "Suspended":  "Suspenso",
        }

        raw = data.get("State", "Unknown")

        return {
            "jobId":      str(data.get("Id", job_id)),
            "stateRaw":   raw,
            "state":      STATE_MAP.get(raw, raw),
            "isFinished": raw in ("Successful", "Faulted", "Stopped"),
            "isSuccess":  raw == "Successful",
            "startTime":  data.get("StartTime"),
            "endTime":    data.get("EndTime"),
            "info":       data.get("Info"),
        }