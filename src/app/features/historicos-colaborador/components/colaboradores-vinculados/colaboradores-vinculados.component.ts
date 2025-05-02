import { CommonModule } from '@angular/common';
import { Component, EventEmitter, input, OnInit, Output } from '@angular/core';
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
import { Colaborador } from '../../services/models/colaborador.model';
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
  providers: [MessageService],
})
export class ColaboradoresVinculadosComponent {
  @Output()
  enviarSolicitacao: EventEmitter<boolean> = new EventEmitter<boolean>();

  formApontamento!: FormGroup;
  projetoSelecionado!: Projeto;
  colaboradoresAdicionados!: Colaborador[];
  desabilitar = false;

  constructor(
    private fb: FormBuilder,
    private messageService: MessageService
  ) {}

  enviar(): void {
    if (this.validarEnvio()) this.enviarSolicitacao.emit(true);
  }

  validarEnvio(): boolean {
    return true;
  }

  notificar(mensagem: string) {
    this.messageService.add({
      severity: 'error',
      summary: 'Erro',
      detail: mensagem,
    });
  }

  limparFormulario(): void {
    this.projetoSelecionado = null;
    this.colaboradoresAdicionados = [];
  }

  retornaListaColaboradoresTabela(): Colaborador[] {
    return this.projetoSelecionado
      ? this.projetoSelecionado.colaboradores.concat(
          this.colaboradoresAdicionados
        )
      : this.colaboradoresAdicionados;
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

  desabilitarForm(habilitar: boolean): void {
    this.desabilitar = habilitar;
  }
}
