import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorldMapComponent } from './world-map/world-map.component';
import { MilestonesComponent } from './milestones/milestones.component';

@Component({
  selector: 'app-learning',
  standalone: true,
  imports: [CommonModule, MilestonesComponent, WorldMapComponent],
  templateUrl: './learning.component.html',
  styleUrl: './learning.component.css'
})
export class LearningComponent {}
