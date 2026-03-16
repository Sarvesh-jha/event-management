import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { Chart, ChartType, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-chart-card',
  imports: [CommonModule],
  templateUrl: './chart-card.component.html',
  styleUrl: './chart-card.component.scss',
})
export class ChartCardComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() chartType: ChartType = 'bar';
  @Input() labels: string[] = [];
  @Input() values: number[] = [];
  @Input() colors: string[] = ['#38bdf8', '#22c55e', '#f59e0b', '#fb7185', '#818cf8'];

  @ViewChild('chartCanvas') private readonly chartCanvas?: ElementRef<HTMLCanvasElement>;

  private chart?: Chart;

  ngAfterViewInit(): void {
    this.renderChart();
  }

  ngOnChanges(_changes: SimpleChanges): void {
    this.renderChart();
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  private renderChart(): void {
    const canvas = this.chartCanvas?.nativeElement;
    if (!canvas || !this.labels.length) {
      return;
    }

    this.chart?.destroy();

    this.chart = new Chart(canvas, {
      type: this.chartType,
      data: {
        labels: this.labels,
        datasets: [
          {
            data: this.values,
            backgroundColor: this.colors,
            borderColor: this.colors,
            borderWidth: 2,
            fill: this.chartType === 'line',
            tension: 0.35,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: this.chartType === 'doughnut',
            labels: {
              color: '#cbd5e1',
            },
          },
        },
        scales:
          this.chartType === 'doughnut'
            ? {}
            : {
                x: {
                  ticks: {
                    color: '#94a3b8',
                  },
                  grid: {
                    display: false,
                  },
                },
                y: {
                  beginAtZero: true,
                  ticks: {
                    color: '#94a3b8',
                  },
                  grid: {
                    color: 'rgba(148, 163, 184, 0.12)',
                  },
                },
              },
      },
    });
  }
}
