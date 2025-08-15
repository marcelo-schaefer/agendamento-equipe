import { Colaborador } from './../../services/models/colaborador.model';
import {
  Component,
  EventEmitter,
  inject,
  Output,
  ViewChild,
} from '@angular/core';
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
import { ChipModule } from 'primeng/chip';
import { BuscaColaboradoresComponent } from '../busca-colaboradores/busca-colaboradores.component';
import { InformacoesColaboradorService } from '../../services/informacoes-colaborador.service';
import { firstValueFrom } from 'rxjs';
import {
  BodyColaboradorePorData,
  ColaboradoresParaBusca,
  ColaboradoresPorData,
  ProjetoPorData,
} from '../../services/models/colaboradorePorData';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-colaboradores-gravados',
  templateUrl: './colaboradores-gravados.component.html',
  styleUrls: ['./colaboradores-gravados.component.css'],
  standalone: true,
  imports: [
    BuscaColaboradoresComponent,
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
    ChipModule,
  ],
})
export class ColaboradoresGravadosComponent {
  @ViewChild(BuscaColaboradoresComponent, { static: true })
  buscaColaboradoresComponent: BuscaColaboradoresComponent | undefined;

  @Output()
  colaboradorEmitter: EventEmitter<Colaborador> =
    new EventEmitter<Colaborador>();

  private informacoesColaboradorService = inject(InformacoesColaboradorService);

  listaColaboradoresPorData: ColaboradoresPorData[] = [];
  listaColunas: string[];
  desabilitar = false;
  apresentarFiltroData = false;
  erroNasDatas = false;
  loading = false;
  dataInicio: Date;
  dataFinal: Date;
  nTop = 10;
  nSkip = 0;
  aPapelAdm = 'N';

  constructor(private messageService: MessageService) {}

  async preencherListaColaborador(lista: Colaborador[]): Promise<void> {
    this.listaColaboradoresPorData = this.listaColaboradoresPorData.filter(
      (colabData) =>
        !lista.some(
          (colab) =>
            colabData.NEmpresa === colab.NEmpresa &&
            colabData.NTipoColaborador === colab.NTipoColaborador &&
            colabData.NMatricula === colab.NMatricula
        )
    );

    await this.buscaDadosColaboradores(
      this.montaCorpoBuscaComColaboradores(
        lista.map((colab) => this.converteColaboradorParaBusca(colab))
      )
    );
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
          this.recalculaDataParaColaboradores();
        }
      } else this.preencherListaColunasPorPeriodo();
    }
    this.apresentarFiltroData = this.erroNasDatas;
  }

  validarDataInicioAntesDaDataFim(dataInicio: Date, dataFim: Date): boolean {
    return dataInicio <= dataFim;
  }

  notificarErro(mensagem: string) {
    this.messageService.add({
      severity: 'error',
      summary: 'Erro',
      detail: mensagem,
      life: 7000,
    });
  }

  async buscaDadosColaboradores(body: BodyColaboradorePorData): Promise<void> {
    try {
      this.carregarTabela(true);
      const colaboradores = await firstValueFrom(
        this.informacoesColaboradorService.buscaColaboradoresPorDatas(body)
      );
      if (colaboradores.outputData.message) {
        this.notificarErro(
          'Erro ao buscar os lançamentos para o(s) colaborador(es), ' +
            colaboradores.outputData.message
        );
      } else if (colaboradores?.outputData?.colaboradores) {
        this.listaColaboradoresPorData = this.listaColaboradoresPorData.concat(
          this.tratarRetorno(colaboradores.outputData.colaboradores)
        );
        this.ordenaLista();
      }
    } catch (error) {
      console.error(error);
      this.notificarErro(
        'Erro ao buscar os lançamentos para o(s) colaborador(es), tente mais tarde ou contate o administrador. ' +
          error
      );
      this.carregarTabela(false);
    }
    this.carregarTabela(false);
  }

  carregarTabela(loading: boolean): void {
    this.loading = loading;
  }

  desabilitarFormulario(desabilitar: boolean): void {
    this.carregarTabela(desabilitar);
    this.desabilitar = desabilitar;
  }

  preencherPapelAdm(papelAdm: string): void {
    this.aPapelAdm = papelAdm || 'N';
    this.buscaColaboradoresComponent?.preencherPapelAdm(papelAdm);
  }

  geraOpcoesIniciais(): void {
    this.buscaColaboradoresComponent.opcoesIniciais();
  }

  buscarTodosColaboradores(): void {
    if (this.dataInicio && this.dataFinal) {
      if (this.nSkip == 0) this.listaColaboradoresPorData = [];
      this.buscaDadosColaboradores(this.montaCorpoBuscaTodos());
      this.nSkip = +10;
    } else {
      this.notificarErro('Por favor, selecione as datas de início e fim.');
    }
  }

  buscarColaboradorSelecionado(): void {
    if (
      this.dataInicio &&
      this.dataFinal &&
      this.buscaColaboradoresComponent.colaborador &&
      !this.validarColaboradorJaNaLista()
    ) {
      this.nSkip = 0;
      this.buscaDadosColaboradores(
        this.montaCorpoBuscaComColaboradores([
          this.converteColaboradorParaBusca(
            this.buscaColaboradoresComponent.colaborador
          ),
        ])
      );
    } else {
      if (!this.dataInicio || !this.dataFinal) {
        this.notificarErro('Por favor, selecione as datas de início e fim.');
      }
      if (!this.buscaColaboradoresComponent.colaborador) {
        this.notificarErro('Por favor, selecione um colaborador para buscar.');
      }
    }
  }

  recalculaDataParaColaboradores(): void {
    if (
      this.dataInicio &&
      this.dataFinal &&
      this.listaColaboradoresPorData.length > 0
    ) {
      const body = this.montaCorpoBuscaComColaboradores(
        this.listaColaboradoresPorData.map((colaborador) =>
          this.converteColaboradorParaBusca(colaborador)
        )
      );
      this.listaColaboradoresPorData = [];
      this.buscaDadosColaboradores(body);
    }
  }

  validarColaboradorJaNaLista(): boolean {
    const colaboradorSelecionado =
      this.buscaColaboradoresComponent?.colaborador;
    const estaNaLista =
      colaboradorSelecionado &&
      this.listaColaboradoresPorData.some(
        (colaborador) =>
          colaborador.NEmpresa === colaboradorSelecionado.NEmpresa &&
          colaborador.NTipoColaborador ===
            colaboradorSelecionado.NTipoColaborador &&
          colaborador.NMatricula === colaboradorSelecionado.NMatricula
      );
    if (estaNaLista) this.notificarErro('Colaborador já está na lista.');
    return estaNaLista;
  }

  tratarRetorno(
    listaColaboradores: ColaboradoresPorData[]
  ): ColaboradoresPorData[] {
    if (!Array.isArray(listaColaboradores))
      listaColaboradores = [listaColaboradores];

    listaColaboradores.forEach((colaborador) => {
      if (colaborador?.projetos) {
        if (!Array.isArray(colaborador.projetos))
          colaborador.projetos = [colaborador.projetos];

        colaborador.projetos.forEach((projeto) => {
          if (projeto.lancamentos) {
            if (!Array.isArray(projeto.lancamentos))
              projeto.lancamentos = [projeto.lancamentos];
          }
        });
      }
    });

    return listaColaboradores;
  }

  ordenaLista(): void {
    this.listaColaboradoresPorData.sort((a, b) =>
      a.NMatricula.localeCompare(b.NMatricula)
    );
  }

  montaCorpoBuscaTodos(): BodyColaboradorePorData {
    return {
      dDataInicio: this.formatarData(this.dataInicio),
      dDataFim: this.formatarData(this.dataFinal),
      nTop: this.nTop,
      nSkip: this.nSkip,
      aPapelAdm: this.aPapelAdm,
    };
  }

  montaCorpoBuscaComColaboradores(
    colaborador: ColaboradoresParaBusca[]
  ): BodyColaboradorePorData {
    return {
      dDataInicio: this.formatarData(this.dataInicio),
      dDataFim: this.formatarData(this.dataFinal),
      nTop: this.nTop,
      nSkip: this.nSkip,
      aPapelAdm: this.aPapelAdm,
      colaboradoresBusca: colaborador,
    };
  }

  formatarData(data: Date): string {
    return data ? format(data, 'dd/MM/yyyy') : '';
  }

  converteColaboradorParaBusca(
    colaborador: Colaborador | ColaboradoresPorData
  ): ColaboradoresParaBusca {
    return {
      nEmpresa: Number(colaborador.NEmpresa || 0),
      nTipoColaborador: Number(colaborador.NTipoColaborador || 0),
      nMatricula: Number(colaborador.NMatricula || 0),
    };
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
    this.listaColunas = dias.map((dia) => this.formatarData(dia));
  }

  obterTipoLancamento(projeto: ProjetoPorData, data: string): string {
    if (!projeto.lancamentos) return '-';
    const lanc = projeto.lancamentos.find((l) => l.DData === data);
    return lanc ? lanc.ATipoLancamento : '-';
  }

  copiarColaborador(colaborador: Colaborador): void {
    this.colaboradorEmitter.emit(colaborador);
  }
}
