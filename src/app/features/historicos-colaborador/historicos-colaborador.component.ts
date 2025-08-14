import {
  AfterViewInit,
  Component,
  inject,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { finalize, firstValueFrom, lastValueFrom } from 'rxjs';

import { CalendarModule } from 'primeng/calendar';

import { InformacoesColaboradorService } from './services/informacoes-colaborador.service';
import { Colaborador } from './services/models/colaborador.model';

import { LoadingComponent } from '../../shared/components/loading/loading.component';
import { FormsModule } from '@angular/forms';
import { ToastModule } from 'primeng/toast';
import { RippleModule } from 'primeng/ripple';
import { MessageService } from 'primeng/api';
import { Apontamento } from './services/models/apontamento';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DadosProjetoComponent } from './components/dados-projeto/dados-projeto.component';
import { Projeto } from './services/models/projeto.model';
import {
  ColaboradoresPersistencia,
  Persistencia,
} from './services/models/persistencia';
import { CorpoBusca } from './services/models/corpo-busca';
import { ButtonModule } from 'primeng/button';
import { BuscaColaboradoresComponent } from './components/busca-colaboradores/busca-colaboradores.component';
import { ColaboradoresGravadosComponent } from './components/colaboradores-gravados/colaboradores-gravados.component';
import { PapelAdm } from './services/models/papel-adm';

@Component({
  selector: 'app-historicos-colaborador',
  standalone: true,
  imports: [
    FormsModule,
    DadosProjetoComponent,
    BuscaColaboradoresComponent,
    ColaboradoresGravadosComponent,
    LoadingComponent,
    CalendarModule,
    ToastModule,
    ProgressSpinnerModule,
    RippleModule,
  ],
  providers: [MessageService],
  templateUrl: './historicos-colaborador.component.html',
  styleUrl: './historicos-colaborador.component.css',
})
export class HistoricosColaboradorComponent implements OnInit, AfterViewInit {
  @ViewChild(DadosProjetoComponent, { static: true })
  dadosProjetoComponent: DadosProjetoComponent | undefined;

  @ViewChild(ColaboradoresGravadosComponent, { static: true })
  colaboradoresGravadosComponent: ColaboradoresGravadosComponent | undefined;

  private informacoesColaboradorService = inject(InformacoesColaboradorService);

  protected informacoesColaborador = signal<Colaborador | undefined>(undefined);
  carregandoInformacoes = signal(false);

  listaProjetos!: Projeto[];
  listaColaboradores!: Colaborador[];
  listaColaboradoresGravados: Colaborador[] = [];
  projetoSelecionado!: Projeto;
  papelSolicitante!: PapelAdm;

  constructor(private messageService: MessageService) {}

  ngOnInit(): void {
    this.carregandoInformacoes.set(true);
    this.desabilitarFormulario(true);
    this.inicializaComponente();
  }

  async ngAfterViewInit(): Promise<void> {
    await this.inicializarVerificacaoPapel();
    await this.inicializarBuscaProjetos();
    this.carregandoInformacoes.set(false);
    this.desabilitarFormulario(false);
  }

  inicializaComponente(): void {
    this.dadosProjetoComponent.limparFormulario();
  }

  async inicializarVerificacaoPapel(): Promise<void> {
    await this.verificaPapelSolicitante();
    this.dadosProjetoComponent.preencherPapelAdm(
      this.papelSolicitante?.APapelAdmAgendaEquipe || 'N'
    );
    this.colaboradoresGravadosComponent.preencherPapelAdm(
      this.papelSolicitante?.APapelAdmAgendaEquipe || 'N'
    );
    this.dadosProjetoComponent.geraOpcoesIniciais();
    this.colaboradoresGravadosComponent.geraOpcoesIniciais();
  }

  async inicializarBuscaProjetos(): Promise<void> {
    await this.buscaProjetos();
    this.tratarProjetos();
    this.dadosProjetoComponent.preencheListaProjetos(this.listaProjetos);
  }

  async reinicializarComponente(): Promise<void> {
    this.validarColaboradoresGravados();
    this.colaboradoresGravadosComponent.preencherListaColaborador(
      this.listaColaboradoresGravados
    );
    this.carregandoInformacoes.set(true);
    this.dadosProjetoComponent.limparFormulario();
    this.carregandoInformacoes.set(false);
    this.desabilitarFormulario(false);
  }

  validarColaboradoresGravados(): void {
    this.listaColaboradoresGravados = JSON.parse(
      JSON.stringify(this.dadosProjetoComponent.listaColaboradores)
    );
  }

  tratarProjetos(): void {
    if (this.listaProjetos) {
      if (!Array.isArray(this.listaProjetos))
        this.listaProjetos = [this.listaProjetos];

      this.listaProjetos = this.ordenarProjetosPorNome(this.listaProjetos);
    }
  }

  ordenarProjetosPorNome(projetos: Projeto[]): Projeto[] {
    return projetos.sort((a, b) => {
      if (a.ANome.toLowerCase() < b.ANome.toLowerCase()) {
        return -1;
      }
      if (a.ANome.toLowerCase() > b.ANome.toLowerCase()) {
        return 1;
      }
      return 0;
    });
  }

  async buscaProjetos(): Promise<void> {
    try {
      const projetos = await firstValueFrom(
        this.informacoesColaboradorService.obterListaProjetos()
      );
      if (projetos.outputData.message) {
        this.notificarErro(
          'Erro ao buscar a lista de projetos, ' + projetos.outputData.message
        );
      } else this.listaProjetos = projetos.outputData.projetos;
    } catch (error) {
      console.error(error);
      this.notificarErro(
        'Erro ao buscar a lista de projetos, tente mais tarde ou contate o admnistrador. ' +
          error
      );
      this.carregandoInformacoes.set(false);
    }
  }

  async verificaPapelSolicitante(): Promise<void> {
    try {
      const projetos = await firstValueFrom(
        this.informacoesColaboradorService.verificaPapel()
      );
      if (projetos.outputData.message) {
        this.notificarErro(
          'Erro ao identificar papeis do solicitante, a procura de colaboradores seguirá pela a hierarquia, ' +
            projetos.outputData.message
        );
      } else this.papelSolicitante = projetos.outputData;
    } catch (error) {
      console.error(error);
      this.notificarErro(
        'Erro ao identificar papeis do solicitante, a procura de colaboradores seguirá pela a hierarquia, tente mais tarde ou contate o admnistrador. ' +
          error
      );
      this.carregandoInformacoes.set(false);
    }
  }

  notificarErro(mensagem: string) {
    this.messageService.add({
      severity: 'error',
      summary: 'Erro',
      detail: mensagem,
      life: 10000,
    });
  }
  notificarSucesso(mensagem: string) {
    this.messageService.add({
      severity: 'success',
      summary: 'Erro',
      detail: mensagem,
      life: 10000,
    });
  }

  copiarColaborador(colaborador: Colaborador): void {
    this.dadosProjetoComponent.copiarColaborador(colaborador);
  }

  async enviarSolicitacao(): Promise<void> {
    this.desabilitarFormulario(true);
    this.carregandoInformacoes.set(true);
    await this.gravarEnvio();
  }

  desabilitarFormulario(desabilitar: boolean): void {
    this.dadosProjetoComponent.desabilitarFormulario(desabilitar);
    this.colaboradoresGravadosComponent.desabilitarFormulario(desabilitar);
  }

  async gravarEnvio(): Promise<void> {
    await lastValueFrom(
      this.informacoesColaboradorService.gravarEnvio(this.montaCorpoEnvio())
    ).then(
      (data) => {
        if (data.outputData.message || data.outputData.ARetorno != 'OK') {
          this.notificarErro(
            'Erro ao gravar os agendamentos dos colaboradores, ' +
              (data.outputData?.message || data.outputData?.ARetorno)
          );
          this.carregandoInformacoes.set(false);
          this.desabilitarFormulario(false);
        } else {
          this.notificarSucesso('Gravado com sucesso!');
          this.reinicializarComponente();
        }
      },
      () => {
        this.notificarErro(
          'Erro ao gravar os agendamentos dos colaboradores, tente mais tarde ou contate o administrador'
        );
        this.carregandoInformacoes.set(false);
        this.desabilitarFormulario(false);
      }
    );
  }

  validaEdicaoLancamento(data: string | Date): boolean {
    const dataHoje = new Date();
    dataHoje.setHours(0, 0, 0, 0);
    return typeof data === 'string'
      ? this.stringParaDate(data) >= dataHoje
      : data >= dataHoje;
  }

  stringParaDate(dataStr: string): Date {
    const [dia, mes, ano] = dataStr.split('/').map(Number);
    return new Date(ano, mes - 1, dia);
  }

  montaCorpoEnvio(): Persistencia {
    const persistencia: Persistencia = {
      colaboradores: [],
    };

    this.dadosProjetoComponent.listaColaboradores.forEach((colaborador) => {
      if (colaborador.lancamentos)
        colaborador.lancamentos.forEach((lancamento) => {
          if (this.validaEdicaoLancamento(lancamento.DData))
            persistencia.colaboradores.push({
              nEmpresa: Number(colaborador.NEmpresa),
              nTipoColaborador: Number(colaborador.NTipoColaborador),
              nMatricula: Number(colaborador.NMatricula),
              nCodigoProjeto: Number(colaborador.projetoSelecionado.NId),

              aFullTime:
                colaborador.tipoAlocacaoSelecionado == 'Full-Time' ? 'S' : 'N',
              dData: lancamento.DData,
              aTipoLAncamento: lancamento.ATipoLancamento,
            } as ColaboradoresPersistencia);
        });
    });
    return persistencia;
  }
}
