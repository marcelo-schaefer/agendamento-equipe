import { Colaborador } from './../../services/models/colaborador.model';
import {
  AfterViewInit,
  Component,
  EventEmitter,
  inject,
  input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { CardModule } from 'primeng/card';
import { Projeto, RetornoProjeto } from '../../services/models/projeto.model';
import { DropdownChangeEvent, DropdownModule } from 'primeng/dropdown';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CommonModule } from '@angular/common';
import { InputSwitchModule } from 'primeng/inputswitch';
import { CalendarModule } from 'primeng/calendar';
import { MessagesModule } from 'primeng/messages';
import { ToastModule } from 'primeng/toast';
import { RippleModule } from 'primeng/ripple';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';
import { InformacoesColaboradorService } from '../../services/informacoes-colaborador.service';
import { firstValueFrom } from 'rxjs';
import { Message, MessageService } from 'primeng/api';
import { CorpoBusca } from '../../services/models/corpo-busca';

@Component({
  selector: 'app-dados-projeto',
  templateUrl: './dados-projeto.component.html',
  styleUrls: ['./dados-projeto.component.css'],
  standalone: true,
  providers: [MessageService],
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
    InputNumberModule,
  ],
})
export class DadosProjetoComponent implements OnInit {
  @Output()
  projetoSelecionadoEmit: EventEmitter<Projeto> = new EventEmitter<Projeto>();

  @Output()
  colaboradorAdicionado: EventEmitter<Colaborador> =
    new EventEmitter<Colaborador>();

  private informacoesColaboradorService = inject(InformacoesColaboradorService);

  listaProjetos: Projeto[] = [];
  listaColaboradores: Colaborador[] = [];
  projetoSelecionado!: Projeto;
  colaboradorSelecionado: Colaborador;
  dadosBusca: CorpoBusca;
  horasProjeto: number = 1;

  messages: Message[] | undefined = [
    {
      severity: 'error',
      detail: 'O colaborador já está presente ou previsto no projeto.',
    },
  ];

  desabilitar = false;
  apresentarErro = false;

  constructor(private messageService: MessageService) {}

  ngOnInit() {}

  preencheListaProejtos(projetos: Projeto[]): void {
    this.listaProjetos = projetos;
  }

  desabilitarFormulario(desabilitar: boolean): void {
    this.desabilitar = desabilitar;
  }

  selecionarColaborador(colaborador: Colaborador): void {
    this.colaboradorSelecionado = colaborador;
  }

  selecionarProjeto(projeto: DropdownChangeEvent): void {
    this.projetoSelecionado = projeto.value;
    this.apresentarErroColaboradorDuplicado(false);
    this.emitirProjeto();
  }

  emitirProjeto(): void {
    this.projetoSelecionadoEmit.emit(this.projetoSelecionado);
  }

  notificarErro(mensagem: string) {
    this.messageService.add({
      severity: 'error',
      summary: 'Erro',
      detail: mensagem,
    });
  }

  limparFormulario(): void {
    this.projetoSelecionado = null;
    this.colaboradorSelecionado = null;
    this.horasProjeto = 1;
  }

  adicionarColaboradorAoProjeto(): void {
    this.apresentarErroColaboradorDuplicado(false);
    this.colaboradorAdicionado.emit(this.colaboradorSelecionado);
  }

  validarHabilitarBotaoAdicionar(): boolean {
    return (
      this.desabilitar ||
      !this.projetoSelecionado ||
      !this.colaboradorSelecionado
    );
  }

  apresentarErroColaboradorDuplicado(apresentar: boolean): void {
    this.apresentarErro = apresentar;
  }

  async buscaColaboradores(): Promise<void> {
    try {
      const colaboradores = await firstValueFrom(
        this.informacoesColaboradorService.obterListaColaboradores(
          this.dadosBusca
        )
      );
      if (
        colaboradores.outputData.message ||
        colaboradores.outputData.ARetorno != 'OK'
      ) {
        this.notificarErro(
          'Erro ao buscar os colaboradores, ' +
            (colaboradores.outputData.message ||
              colaboradores.outputData.ARetorno)
        );
      } else this.listaColaboradores = colaboradores.outputData.colaboradores;
    } catch (error) {
      console.error(error);
      this.notificarErro(
        'Erro ao buscar a lista de projetos, tente mais tarde ou contate o admnistrador. ' +
          error
      );
    }
  }
}
