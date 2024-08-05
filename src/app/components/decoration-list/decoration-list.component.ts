import { Component, ElementRef, EventEmitter, HostListener, Input, OnInit, Output, ViewChild } from '@angular/core';
import * as _ from 'lodash';
import { VirtualScrollerComponent } from '@iharbeck/ngx-virtual-scroller';
import { DecorationModel } from '../../models/decoration.model';
import { SkillModel } from '../../models/skill.model';
import { DataService } from '../../services/data.service';
import { SlotService } from '../../services/slot.service';
import { TooltipService } from '../../services/tooltip.service';

@Component({
	selector: 'mhw-builder-decoration-list',
	templateUrl: './decoration-list.component.html',
	styleUrls: ['./decoration-list.component.scss']
})
export class DecorationListComponent implements OnInit {
	private _decorationLevel: number;

	@Input()
	set decorationLevel(decorationLevel: number) {
		this._decorationLevel = decorationLevel;
		this.loadItems();
	}
	get decorationLevel(): number { return this._decorationLevel; }

	@Output() decorationSelected = new EventEmitter<DecorationModel>();

	@ViewChild('searchBox', { static: true }) searchBox: ElementRef;
	@ViewChild('decorationList') decorationList: VirtualScrollerComponent;

	decorations: DecorationModel[];
	filteredDecorations: DecorationModel[];
	virtualDecorations: DecorationModel[];

	@HostListener('window:resize')
	onResize() {
		this.refreshList();
	}

	constructor(
		public dataService: DataService,
		private slotService: SlotService,
		private tooltipService: TooltipService
	) { }

	ngOnInit(): void { }

	refreshList() {
		if (this.decorationList) {
			this.decorationList.refresh();
		}
	}

	onDecorationListUpdate(decorations: DecorationModel[]) {
		this.virtualDecorations = decorations;
	}

	loadItems() {
		this.decorations = this.dataService.getDecorations(this.decorationLevel);
		this.decorations = this.decorations.sort((a, b) => {
			if (a.priority < b.priority) {
				return 1;
			} else if (a.priority > b.priority) {
				return -1;
			} else if (a.level < b.level) {
				return 1;
			} else if (a.level > b.level) {
				return -1;
			} else {
				if (a.skills.length < b.skills.length) {
					return -1;
				} else if (a.skills.length > b.skills.length) {
					return 1;
				} else {
					return 0;
				}
			}
		});
		this.filteredDecorations = this.decorations;
		this.search(this.searchBox.nativeElement.value);
		setTimeout(() => this.searchBox.nativeElement.focus(), 250);
	}

	search(query: string) {
		this.filteredDecorations = this.decorations;

		if (query) {
			query = query.toLowerCase().trim();
			const queryParts = query.split(' ');

			if (this.decorations) {
				for (const decoration of this.decorations) {
					const itemName = decoration.name.toLowerCase();
					const skills = this.dataService.getSkills(decoration.skills);

					const nameMatch = itemName.includes(query);

					let skillMatch = true;
					for (const queryPart of queryParts) {
						skillMatch = _.some(skills, skill => skill.name.toLowerCase().includes(queryPart));
						if (!skillMatch) {
							break;
						}
					}

					if (!nameMatch && !skillMatch) {
						this.filteredDecorations = _.reject(this.filteredDecorations, d => d.name === decoration.name);
					}
				}
			}
		} else {
			this.resetSearchResults();
		}
	}

	resetSearchResults() {
		this.searchBox.nativeElement.value = null;
		this.filteredDecorations = this.decorations;
	}

	selectDecoration(decoration: DecorationModel) {
		const newDecoration = Object.assign({}, decoration);
		this.slotService.selectDecoration(newDecoration);
	}

	getSkills(decoration: DecorationModel): SkillModel[] {
		const result: SkillModel[] = [];
		for (const skill of decoration.skills) {
			result.push(this.dataService.getSkill(skill.id));
		}
		return result;
	}

	getSkillCount(decoration: DecorationModel, skill: SkillModel): string {
		const itemSkill = _.find(decoration.skills, s => s.id == skill.id);
		const result = `${itemSkill.level}/${skill.levels.length}`;
		return result;
	}
}
