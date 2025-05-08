import { Colaborador } from './../../services/models/colaborador.model';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  input,
  OnInit,
  Output,
} from '@angular/core';
import {
  FormsModule,
  ReactiveFormsModule,
  FormGroup,
  FormBuilder,
  Validators,
} from '@angular/forms';
import { MessageService, Message } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { CardModule } from 'primeng/card';
import { DropdownModule } from 'primeng/dropdown';
import { InputSwitchModule } from 'primeng/inputswitch';
import { InputTextModule } from 'primeng/inputtext';
import { MessagesModule } from 'primeng/messages';
import { RippleModule } from 'primeng/ripple';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { Apontamento } from '../../services/models/apontamento';
import { Projeto } from '../../services/models/projeto.model';

@Component({
  selector: 'app-colaboradores-vinculados',
  templateUrl: './colaboradores-vinculados.component.html',
  styleUrls: ['./colaboradores-vinculados.component.css'],
  standalone: true,
  imports: [
    CardModule,
    DropdownModule,
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
  ],
})
export class ColaboradoresVinculadosComponent implements OnInit {
  @Output()
  enviarSolicitacao: EventEmitter<boolean> = new EventEmitter<boolean>();

  formApontamento!: FormGroup;
  projetoSelecionado!: Projeto;
  colaboradoresAdicionados!: Colaborador[];
  desabilitar = false;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.limparFormulario();
  }

  enviar(): void {
    if (this.validarEnvio()) this.enviarSolicitacao.emit(true);
  }

  validarEnvio(): boolean {
    return true;
  }

  preencherProjetoSelecionado(projeto: Projeto): void {
    this.projetoSelecionado = projeto;
    this.atualizarColaboradoresNoProjeto();
    this.cdr.detectChanges();
  }

  atualizarColaboradoresNoProjeto(): void {
    this.colaboradoresAdicionados.forEach((colaborador) => {
      colaborador.nIdProjetoVinculado = this.projetoSelecionado.NId;
    });
  }

  limparFormulario(): void {
    this.projetoSelecionado = null;
    this.colaboradoresAdicionados = [];
  }

  adicionarColaborador(colaborador: Colaborador): void {
    const colaboradorNaoPlanejado = this.projetoSelecionado.colaboradores.find(
      (f) => f.NMatricula == colaborador.NMatricula
    );

    if (colaboradorNaoPlanejado) {
      colaborador.NHorasApontadas = colaboradorNaoPlanejado.NHorasApontadas;
      colaborador.NDesvio = this.calculaDesvio(colaborador);
    }

    colaborador.AOrigem = 'Planejado';
    this.colaboradoresAdicionados.push(colaborador);
  }

  calculaDesvio(colaborador: Colaborador): string {
    const horasTotais = colaborador?.NHorasTotais
      ? Number(colaborador?.NHorasTotais) * 60
      : 0;
    const horasApontadas = this.converterParaMinutos(
      colaborador?.NHorasApontadas
    );

    if (horasTotais < horasApontadas)
      return (
        '- ' + this.converterParaHoraFormatada(horasApontadas - horasTotais)
      );
    else return this.converterParaHoraFormatada(horasTotais - horasApontadas);
  }

  retornaListaColaboradoresTabela(): Colaborador[] {
    return (
      (this.projetoSelecionado && this.projetoSelecionado.colaboradores
        ? this.projetoSelecionado.colaboradores
            .filter(
              (f) =>
                !this.colaboradoresAdicionados.some(
                  (colabAdicionado) =>
                    colabAdicionado.NMatricula == f.NMatricula
                )
            )
            .concat(this.colaboradoresAdicionados)
        : this.colaboradoresAdicionados) || []
    );
  }

  botaoExcluir(colaborador: Colaborador): void {
    this.colaboradoresAdicionados.splice(
      this.colaboradoresAdicionados.indexOf(
        this.colaboradoresAdicionados.find(
          (f) =>
            f?.NEmpresa == colaborador?.NEmpresa &&
            f?.NMatricula == colaborador?.NMatricula
        )
      ),
      1
    );
  }

  desabilitarFormulario(desabilitar: boolean): void {
    this.desabilitar = desabilitar;
  }

  converterParaMinutos(tempo: string): number {
    if (tempo) {
      const [horas, minutos] = tempo.split(':').map(Number);
      return horas * 60 + minutos;
    }
    return 0;
  }

  converterParaHoraFormatada(minutosTotais: number): string {
    if (minutosTotais) {
      const horas = Math.floor(minutosTotais / 60);
      const minutos = minutosTotais % 60;

      const horasFormatadas = horas.toString().padStart(2, '0');
      const minutosFormatados = minutos.toString().padStart(2, '0');

      return `${horasFormatadas}:${minutosFormatados}`;
    }
    return '00:00';
  }
}
