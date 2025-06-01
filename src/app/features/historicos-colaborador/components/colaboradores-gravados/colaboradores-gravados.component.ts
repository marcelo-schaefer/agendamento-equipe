import { Colaborador } from './../../services/models/colaborador.model';
import { Component, EventEmitter, Output } from '@angular/core';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CommonModule, formatDate } from '@angular/common';
import { InputSwitchModule } from 'primeng/inputswitch';
import { CalendarModule } from 'primeng/calendar';
import { MessagesModule } from 'primeng/messages';
import { ToastModule } from 'primeng/toast';
import { RippleModule } from 'primeng/ripple';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';
import { DialogModule } from 'primeng/dialog';
import { FloatLabelModule } from 'primeng/floatlabel';
import { eachDayOfInterval, format } from 'date-fns';

@Component({
  selector: 'app-colaboradores-gravados',
  templateUrl: './colaboradores-gravados.component.html',
  styleUrls: ['./colaboradores-gravados.component.css'],
  standalone: true,
  imports: [
    CardModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    InputSwitchModule,
    CalendarModule,
    MessagesModule,
    ToastModule,
    RippleModule,
    InputNumberModule,
    DialogModule,
    FloatLabelModule,
  ],
})
export class ColaboradoresGravadosComponent {
  @Output()
  colaboradorEmitter: EventEmitter<Colaborador> =
    new EventEmitter<Colaborador>();

  listaColaboradores: Colaborador[] = [];
  listaColunas: string[];
  desabilitar = false;
  apresentarFiltroData = false;
  erroNasDatas = false;
  dataInicio: Date;
  dataFinal: Date;

  constructor() {}

  preencherListaColaborador(lista: Colaborador[]): void {
    this.listaColaboradores = this.listaColaboradores.concat(lista);
  }

  aplicarFiltroData(): void {
    if (this.dataInicio || this.dataFinal) {
      if (this.dataInicio && !this.dataFinal) {
        this.dataFinal = new Date();
        this.dataFinal.setDate(this.dataInicio.getDate() + 30);
      } else if (!this.dataInicio && this.dataFinal) {
        this.dataInicio = new Date();
        this.dataInicio.setDate(this.dataFinal.getDate() - 30);
      }

      if (this.dataInicio && this.dataFinal) {
        this.erroNasDatas = !this.validarDataInicioAntesDaDataFim(
          this.dataInicio,
          this.dataFinal
        );

        if (!this.erroNasDatas) {
          if (
            this.calcularDistanciaEmDias(this.dataInicio, this.dataFinal) > 60
          ) {
            this.dataFinal.setDate(this.dataInicio.getDate() + 60);
          }
          this.preencherListaColunasPorPeriodo();
        }
      } else this.preencherListaColunasPorPeriodo();
    }
    this.apresentarFiltroData = this.erroNasDatas;
  }

  validarDataInicioAntesDaDataFim(dataInicio: Date, dataFim: Date): boolean {
    return dataInicio <= dataFim;
  }

  calcularDistanciaEmDias(dataInicio: Date, dataFim: Date): number {
    const diffMs = dataFim.getTime() - dataInicio.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  preencherListaColunasPorPeriodo(): void {
    if (!this.dataInicio || !this.dataFinal) {
      this.listaColunas = [];
      return;
    }
    const dias = eachDayOfInterval({
      start: this.dataInicio,
      end: this.dataFinal,
    });
    this.listaColunas = dias.map((dia) => format(dia, 'dd/MM/yyyy'));
  }

  obterTipoLancamento(colaborador: Colaborador, data: string): string {
    if (!colaborador.lancamentos) return '-';
    const lanc = colaborador.lancamentos.find((l) => l.DData === data);
    return lanc ? lanc.ATipoLancamento : '-';
  }

  copiarColaborador(colaborador: Colaborador): void {
    this.colaboradorEmitter.emit(colaborador);
  }
}
