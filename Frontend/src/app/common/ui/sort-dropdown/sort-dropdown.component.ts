import {Component, Input, Output, EventEmitter, OnInit, ViewChild, ElementRef, HostListener} from '@angular/core';
import {TranslateService} from "@ngx-translate/core";
import {UIAnimation} from "../ui-animation";
import {UIService} from "../../services/ui.service";
import {trigger} from "@angular/animations";
import {UIHelper} from "../ui-helper";
import {Helper} from '../../helper';
import {UIConstants} from "../ui-constants";
import {OptionItem} from "../actionbar/option-item";
import {ListItem} from "../list-item";

@Component({
  selector: 'sort-dropdown',
  templateUrl: 'sort-dropdown.component.html',
  styleUrls: ['sort-dropdown.component.scss'],
  animations: [
    trigger('openOverlay', UIAnimation.openOverlay(UIAnimation.ANIMATION_TIME_FAST))
  ]
})
/**
 *
 */
export class SortDropdownComponent{
    @Input() open = false;
    @Output() openChange = new EventEmitter();
    @Input() columns : ListItem[];
    @Input() sortBy : string;
    @Input() sortAscending : boolean;
    @Output() onSort=new EventEmitter();
    constructor(private ui : UIService){}

    public setOpen(open:boolean){
      this.open=open;
      this.openChange.emit(open);
    }

    setSort(item: any) {
        let ascending=this.sortAscending;
        let itemAscending=item.mode=='ascending';
        if(item.name==this.sortBy) {
            if(item.mode!=null){
                // element is limited to one mode, ignore the request
                if(itemAscending==this.sortAscending){
                  return;
                }
            }
            ascending = !ascending;
        }
        else if(item.mode!=null){
          // force mode when switching to item
          ascending=itemAscending;
        }
        (item as any).ascending=ascending;
        this.onSort.emit(item);
        this.setOpen(false);
    }
}
