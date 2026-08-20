import { Component } from '@angular/core';
import { MicroservicesLearningComponent } from './features/microservices-learning/microservices-learning.component';

@Component({
  selector: 'app-root',
  imports: [MicroservicesLearningComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'learning-center';
}
