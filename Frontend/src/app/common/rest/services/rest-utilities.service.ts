import { Injectable } from '@angular/core';
import 'rxjs/add/operator/map'
import { Observable } from 'rxjs/Observable';
import {RestConnectorService} from "./rest-connector.service";
import {RestHelper} from "../rest-helper";
import {RestConstants} from "../rest-constants";
import {
  NodeRef,
  NodeWrapper,
  Node,
  NodePermissions,
  LocalPermissions,
  NodeVersions,
  NodeVersion,
  NodeList,
  NodePermissionsHistory,
  NodeLock,
  NodeShare,
  WorkflowEntry,
  ParentList,
  WebsiteInformation
} from "../data-object";
import {RestIamService} from "./rest-iam.service";
import {RequestObject} from "../request-object";
import {FrameEventsService} from "../../services/frame-events.service";
import {Toast} from "../../ui/toast";
import {NodeHelper} from "../../ui/node-helper";
import {AbstractRestService} from "./abstract-rest-service";

@Injectable()
export class RestUtilitiesService extends AbstractRestService{
  constructor(connector : RestConnectorService) {
      super(connector);
  }
  public getWebsiteInformation = (url:string) => {
    let query=this.connector.createUrl("clientUtils/:version/getWebsiteInformation?url=:url",null,
      [
        [":url",url],
      ]);
    return this.connector.get<WebsiteInformation>(query,this.connector.getRequestOptions());
  }
}
