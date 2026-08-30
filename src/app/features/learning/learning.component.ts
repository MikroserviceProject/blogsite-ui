import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorldMapComponent } from './world-map/world-map.component';
import { MilestonesComponent } from './milestones/milestones.component';
import { SolidPrinciplesComponent } from './solid-principles/solid-principles.component';

@Component({
  selector: 'app-learning',
  standalone: true,
  imports: [CommonModule, MilestonesComponent, WorldMapComponent, SolidPrinciplesComponent],
  templateUrl: './learning.component.html',
  styleUrl: './learning.component.css'
})
export class LearningComponent {}
