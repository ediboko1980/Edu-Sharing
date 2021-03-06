import {NgModule} from '@angular/core';
import {DECLARATIONS} from './declarations';
import {IMPORTS} from './imports';
import {PROVIDERS} from './providers';
import {RouterComponent} from './router/router.component';
import {DECLARATIONS_RECYCLE} from './modules/node-list/declarations';
import {DECLARATIONS_WORKSPACE} from './modules/workspace/declarations';
import {DECLARATIONS_SEARCH} from './modules/search/declarations';
import {PROVIDERS_SEARCH} from './modules/search/providers';
import {DECLARATIONS_COLLECTIONS} from './modules/collections/declarations';
import {DECLARATIONS_LOGIN} from './modules/login/declarations';
import {DECLARATIONS_LOGINAPP} from './modules/login-app/declarations';
import {DECLARATIONS_PERMISSIONS} from './modules/permissions/declarations';
import {DECLARATIONS_OER} from './modules/oer/declarations';
import {DECLARATIONS_ADMIN} from './modules/admin/declarations';
import {DECLARATIONS_MANAGEMENT_DIALOGS} from './modules/management-dialogs/declarations';
import {DECLARATIONS_MESSAGES} from './modules/messages/declarations';
import {DECLARATIONS_UPLOAD} from './modules/upload/declarations';
import {DECLARATIONS_STREAM} from './modules/stream/declarations';
import {DECLARATIONS_PROFILES} from './modules/profiles/declarations';
import {DECLARATIONS_STARTUP} from './modules/startup/declarations';
import {DECLARATIONS_SHARE_APP} from './modules/share-app/declarations';
import {DECLARATIONS_SHARING} from './modules/sharing/declarations';
import {DECLARATIONS_REGISTER} from './modules/register/declarations';
import {DECLARATIONS_SERVICES} from "./modules/services/declarations";
import {DECLARATIONS_FILE_UPLOAD} from './modules/file-upload/declarations';
import {SpinnerComponent} from "./common/ui/spinner/spinner.component";
import {ListTableComponent} from "./common/ui/list-table/list-table.component";
import {CommentsListComponent} from "./modules/management-dialogs/node-comments/comments-list/comments-list.component";
import {MAT_FORM_FIELD_DEFAULT_OPTIONS} from "@angular/material";


// http://blog.angular-university.io/angular2-ngmodule/
// -> Making modules more readable using the spread operator


@NgModule({
  declarations: [
    DECLARATIONS,
    DECLARATIONS_RECYCLE,
    DECLARATIONS_WORKSPACE,
    DECLARATIONS_SEARCH,
    DECLARATIONS_COLLECTIONS,
    DECLARATIONS_LOGIN,
    DECLARATIONS_REGISTER,
    DECLARATIONS_LOGINAPP,
    DECLARATIONS_FILE_UPLOAD,
    DECLARATIONS_STARTUP,
    DECLARATIONS_PERMISSIONS,
    DECLARATIONS_OER,
    DECLARATIONS_STREAM,
    DECLARATIONS_MANAGEMENT_DIALOGS,
    DECLARATIONS_ADMIN,
    DECLARATIONS_UPLOAD,
    DECLARATIONS_PROFILES,
    DECLARATIONS_MESSAGES,
    DECLARATIONS_SHARING,
    DECLARATIONS_SHARE_APP,
    DECLARATIONS_SERVICES
  ],
  entryComponents: [
      SpinnerComponent,
      ListTableComponent,
      CommentsListComponent,
  ],
  imports: IMPORTS,
  providers: [
    PROVIDERS,
    PROVIDERS_SEARCH,
    {provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: {appearance: 'outline'}}
  ],
  bootstrap: [RouterComponent]
})
export class AppModule { }
