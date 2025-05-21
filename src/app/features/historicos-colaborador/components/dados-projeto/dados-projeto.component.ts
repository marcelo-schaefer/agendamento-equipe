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
import { CommonModule, formatDate } from '@angular/common';
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
import { DialogModule } from 'primeng/dialog';
import { FloatLabelModule } from 'primeng/floatlabel';
import { BuscaLancamentos } from '../../services/models/busca-lancamentos';
import { format } from 'date-fns';
import { Lancamento } from '../../services/models/lancamento';

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
    DialogModule,
    FloatLabelModule,
  ],
})
export class DadosProjetoComponent {
  @Output()
  enviarSolicitacao: EventEmitter<boolean> = new EventEmitter<boolean>();

  @Output()
  colaboradorEmitter: EventEmitter<string> = new EventEmitter<string>();

  private informacoesColaboradorService = inject(InformacoesColaboradorService);

  listaProjetos: Projeto[] = [];
  listaColaboradores: Colaborador[] = [];
  colaboradorCopiado: Colaborador;
  listaAlocaacoFullTime: string[] = ['Full-Time', 'Não Full-Time'];
  listaTipoAlocacao = [
    'C',
    'E',
    'CC',
    'EC',
    'CH',
    'FE',
    'SE',
    'P',
    'LM',
    'FD',
    'FS',
    'FG',
  ];
  apresentarFiltroData = false;
  apresentarPreenchimento = false;
  loading = false;
  erroNasDatas = false;
  desabilitar = false;
  dataInicio: Date;
  dataFinal: Date;
  dataInicioMinimaPreenchimento: Date;
  dataFinalMaximaPreenchimento: Date;
  dataInicioPreenchimento: Date;
  dataFinalPreenchimento: Date;
  alocacaoSelecionada: string;
  colaboradorParaBusca: string;
  colaboradorSelecionado: Colaborador;

  messages: Message[] | undefined = [
    {
      severity: 'info',
      detail: 'Salve as alterações antes de buscar novos colaboradores',
    },
  ];
  expandedRows: { [key: string]: boolean } = {};

  constructor(private messageService: MessageService) {}

  preencheListaColaboradores(colaboradores: Colaborador[]): void {
    this.listaColaboradores = colaboradores;
    this.expandedRows = {};
  }

  carregarTabela(loading: boolean): void {
    this.loading = loading;
  }

  preencheListaProejtos(projetos: Projeto[]): void {
    this.listaProjetos = projetos;
  }

  desabilitarFormulario(desabilitar: boolean): void {
    this.carregarTabela(desabilitar);
    this.desabilitar = desabilitar;
  }

  async buscaLancamentos(): Promise<void> {
    try {
      this.carregarTabela(true);
      const projetos = await firstValueFrom(
        this.informacoesColaboradorService.buscaLancamentos(
          this.montaCorpoBusca()
        )
      );
      if (projetos.outputData.message) {
        this.notificarErro(
          'Erro ao buscar a lista de datas com lançamentos, ' +
            projetos.outputData.message
        );
      } else {
        const colaboradorDaLista = this.listaColaboradores.find(
          (f) => f.NMatricula == this.colaboradorSelecionado.NMatricula
        );
        if (colaboradorDaLista) {
          colaboradorDaLista.lancamentos = projetos.outputData.lancamentos;
        }
      }
      this.carregarTabela(false);
    } catch (error) {
      this.carregarTabela(false);
      console.error(error);
      this.notificarErro(
        'Erro ao buscar a lista de datas com lançamentos, tente mais tarde ou contate o admnistrador. ' +
          error
      );
    }
  }

  montaCorpoBusca(): BuscaLancamentos {
    return {
      nEmpresa: Number(this.colaboradorSelecionado.NEmpresa),
      nTipoColaborador: Number(this.colaboradorSelecionado.NTipoColaborador),
      nMatricula: Number(this.colaboradorSelecionado.NMatricula),
      nCodigoProjeto: Number(
        this.colaboradorSelecionado.projetoSelecionado.NId
      ),
      dDataInicio: this.formatarData(this.dataInicio),
      dDataFim: this.formatarData(this.dataFinal),
      aFullTime:
        this.colaboradorSelecionado.tipoAlocacaoSelecionado == 'Full-Time'
          ? 'S'
          : 'N',
    };
  }

  formatarData(data: Date): string {
    return format(data, 'dd/MM/yyyy');
  }

  stringParaDate(dataStr: string): Date {
    const [dia, mes, ano] = dataStr.split('/').map(Number);
    return new Date(ano, mes - 1, dia);
  }

  validaPlanejado(colaborador: Colaborador): string {
    let planejado = '-';
    if (colaborador.projetoSelecionado && colaborador.projetos)
      planejado =
        colaborador.projetos.find(
          (f) => f.NId == colaborador.projetoSelecionado.NId
        )?.NHorasTotais || '-';
    return planejado;
  }

  validaSaldo(colaborador: Colaborador): string {
    let saldo = '-';
    if (colaborador.projetoSelecionado && colaborador.projetos)
      saldo =
        colaborador.projetos.find(
          (f) => f.NId == colaborador.projetoSelecionado.NId
        )?.NDesvio || '-';
    return saldo;
  }

  inicializarFiltroData(colaborador: Colaborador): void {
    this.colaboradorSelecionado = colaborador;
    this.colaboradorSelecionado.validandoCampos = true;
    this.erroNasDatas = false;

    if (
      this.colaboradorSelecionado.projetoSelecionado &&
      this.colaboradorSelecionado.tipoAlocacaoSelecionado
    )
      this.apresentarFiltroData = true;
  }

  inicializarPreenchimento(colaborador: Colaborador): void {
    this.colaboradorSelecionado = colaborador;
    this.erroNasDatas = false;
    this.dataInicioMinimaPreenchimento = this.retornaDataMinimaPreenchimento();
    this.dataFinalMaximaPreenchimento = this.retornaDataMaximaPreenchimento();

    this.apresentarPreenchimento = true;
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

        if (!this.erroNasDatas) this.buscaLancamentos();
      } else this.buscaLancamentos();
    }
    this.apresentarFiltroData = this.erroNasDatas;
  }

  aplicarPreenchimento(): void {
    const colaboradorDaLista = this.listaColaboradores.find(
      (f) => f.NMatricula == this.colaboradorSelecionado.NMatricula
    );

    if (this.dataInicioPreenchimento && this.dataFinalPreenchimento) {
      this.erroNasDatas = !this.validarDataInicioAntesDaDataFim(
        this.dataInicioPreenchimento,
        this.dataFinalPreenchimento
      );
    }
    if (colaboradorDaLista && !this.erroNasDatas) {
      colaboradorDaLista.lancamentos.forEach((lancamento) => {
        const dataLancamento = this.stringParaDate(lancamento.DData);
        if (
          this.validaEdicaoLancamento(lancamento.DData) &&
          (!this.dataInicioPreenchimento ||
            dataLancamento >= this.dataInicioPreenchimento) &&
          (!this.dataFinalPreenchimento ||
            dataLancamento <= this.dataFinalPreenchimento)
        )
          lancamento.ATipoLancamento = this.alocacaoSelecionada;
      });
    }
    this.apresentarPreenchimento = this.erroNasDatas;
  }

  colarColaborador(colaborador: Colaborador): void {
    colaborador.projetoSelecionado = this.colaboradorCopiado.projetoSelecionado;
    colaborador.tipoAlocacaoSelecionado =
      this.colaboradorCopiado.tipoAlocacaoSelecionado;
    colaborador.lancamentos = this.colaboradorCopiado.lancamentos.filter((f) =>
      this.validaEdicaoLancamento(f.DData)
    );
  }

  emitirColaborador(): void {
    this.colaboradorEmitter.emit(this.colaboradorParaBusca);
  }

  notificarErro(mensagem: string) {
    this.messageService.add({
      severity: 'error',
      summary: 'Erro',
      detail: mensagem,
    });
  }

  limparFormulario(): void {
    this.listaColaboradores = [];
  }

  retornaDataMinimaPreenchimento(): Date {
    return this.colaboradorSelecionado &&
      (this.colaboradorSelecionado.lancamentos?.length || 0) > 0
      ? this.stringParaDate(this.colaboradorSelecionado.lancamentos[0].DData)
      : new Date();
  }

  retornaDataMaximaPreenchimento(): Date {
    return this.colaboradorSelecionado &&
      (this.colaboradorSelecionado.lancamentos?.length || 0) > 0
      ? this.stringParaDate(
          this.colaboradorSelecionado.lancamentos[
            this.colaboradorSelecionado.lancamentos?.length - 1
          ].DData
        )
      : new Date();
  }

  validaEdicaoLancamento(data: string | Date): boolean {
    const dataHoje = new Date();
    dataHoje.setHours(0, 0, 0, 0);
    return typeof data === 'string'
      ? this.stringParaDate(data) >= dataHoje
      : data >= dataHoje;
  }

  validarDataInicioAntesDaDataFim(dataInicio: Date, dataFim: Date): boolean {
    return dataInicio <= dataFim;
  }

  enviar(): void {
    this.enviarSolicitacao.emit(true);
  }
}
