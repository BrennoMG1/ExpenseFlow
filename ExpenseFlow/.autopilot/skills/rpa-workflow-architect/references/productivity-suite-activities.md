# XAML Productivity Suite Activities

Microsoft and Google productivity activities patterns for O365, Gmail, GDrive, and SharePoint.

## Overview

Microsoft and Google productivity activities are **real typed activities** (not generic IS `ConnectorActivity`), but they require an Integration Service connection. Always get the full XAML from `RpaActivityDefaultTool` — the patterns below illustrate the key attributes only.

## Connection Pattern

These activities authenticate via two attributes on the activity element:
```xml
ConnectionId="<guid>" UseConnectionService="True"
```

Use `GetProjectContextTool` to obtain the connection GUID.

## Example: O365 Send Email

Package: `UiPath.MicrosoftOffice365.Activities`

```xml
<!-- xmlns needed (add to root <Activity>): -->
<!-- xmlns:umam="clr-namespace:UiPath.MicrosoftOffice365.Activities.Mail;assembly=UiPath.MicrosoftOffice365.Activities" -->
<!-- xmlns:umame="clr-namespace:UiPath.MicrosoftOffice365.Activities.Mail.Enums;assembly=UiPath.MicrosoftOffice365.Activities" -->
<!-- xmlns:umamm="clr-namespace:UiPath.MicrosoftOffice365.Activities.Mail.Models;assembly=UiPath.MicrosoftOffice365.Activities" -->
<!-- xmlns:usau="clr-namespace:UiPath.Shared.Activities.Utils;assembly=UiPath.MicrosoftOffice365.Activities" -->

<umam:SendMailConnections
    ConnectionId="efd4ca45-5d7b-48fd-be1e-d3f5ca4fc68b"
    UseConnectionService="True"
    AuthScopesInvalid="False"
    Subject="Monthly Report"
    Body="Please find the report attached."
    InputType="HTML"
    SaveAsDraft="False"
    IsDeliveryReceiptRequested="False"
    IsReadReceiptRequested="False"
    UseSharedMailbox="False"
    AttachmentInputMode="Existing"
    DisplayName="Send Email">
  <!-- Recipients: IEnumerable<string> -->
  <umam:SendMailConnections.To>
    <InArgument x:TypeArguments="scg:IEnumerable(x:String)">
      <CSharpValue x:TypeArguments="scg:IEnumerable(x:String)">new string[]{"user@example.com"}</CSharpValue>
    </InArgument>
  </umam:SendMailConnections.To>
  <!-- Importance enum (optional) -->
  <umam:SendMailConnections.Importance>
    <InArgument x:TypeArguments="umame:Importance">
      <CSharpValue x:TypeArguments="umame:Importance">UiPath.MicrosoftOffice365.Activities.Mail.Enums.Importance.High</CSharpValue>
    </InArgument>
  </umam:SendMailConnections.Importance>
  <!-- BackupSlot elements (RpaActivityDefaultTool provides these) -->
  <umam:SendMailConnections.MailboxArg>
    <umamm:MailboxArgument SharedMailbox="{x:Null}" UseSharedMailbox="False">
      <umamm:MailboxArgument.Backup>
        <usau:BackupSlot x:TypeArguments="umame:MailboxSelectionMode" StoredValue="NoMailbox">
          <usau:BackupSlot.BackupValues>
            <scg:Dictionary x:TypeArguments="umame:MailboxSelectionMode, scg:List(x:Object)" />
          </usau:BackupSlot.BackupValues>
        </usau:BackupSlot>
      </umamm:MailboxArgument.Backup>
    </umamm:MailboxArgument>
  </umam:SendMailConnections.MailboxArg>
</umam:SendMailConnections>
```

## Example: O365 Get Newest Email

```xml
<umam:GetNewestEmail
    ConnectionId="efd4ca45-5d7b-48fd-be1e-d3f5ca4fc68b"
    UseConnectionService="True"
    AuthScopesInvalid="False"
    BodyAsHtml="False"
    BrowserFolder="Inbox"
    BrowserFolderId="Inbox"
    FilterSelectionMode="ConditionBuilder"
    Importance="Any"
    MarkAsRead="False"
    SelectionMode="Browse"
    UnreadOnly="False"
    UseSharedMailbox="False"
    WithAttachmentsOnly="False"
    DisplayName="Get Newest Email"
    Result="{x:Null}">
  <!-- Filter: subject contains "Important" -->
  <umam:GetNewestEmail.Filter>
    <umamf:MailFilterCollection LogicalOperator="And">
      <umamf:MailFilterCollection.Filters>
        <umamf:MailFilterElement DateValue="{x:Null}" Criteria="Subject" StringOperator="Contains" InStringValue="Important" />
      </umamf:MailFilterCollection.Filters>
    </umamf:MailFilterCollection>
  </umam:GetNewestEmail.Filter>
  <!-- MailFolderArgument and MailboxArg (RpaActivityDefaultTool provides full structure) -->
</umam:GetNewestEmail>
```

## Key Patterns

| Pattern | XAML Syntax |
|---------|-------------|
| Connection | `ConnectionId="<guid>" UseConnectionService="True"` |
| Recipients (To/Cc/Bcc) | `<CSharpValue x:TypeArguments="scg:IEnumerable(x:String)">new string[]{"a@b.com","c@d.com"}</CSharpValue>` |
| Enum values | Full path: `UiPath.MicrosoftOffice365.Activities.Mail.Enums.Importance.High` |
| Output variable | Declare a variable, bind via `Result="[myVar]"` |
| No scopes | `AuthScopesInvalid="False"` — never set scope properties |
