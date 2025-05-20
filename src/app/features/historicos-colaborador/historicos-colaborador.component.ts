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

@Component({
  selector: 'app-historicos-colaborador',
  standalone: true,
  imports: [
    FormsModule,
    DadosProjetoComponent,
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

  private informacoesColaboradorService = inject(InformacoesColaboradorService);

  protected informacoesColaborador = signal<Colaborador | undefined>(undefined);
  carregandoInformacoes = signal(false);

  listaProejtos!: Projeto[];
  listaColaboradores!: Colaborador[];
  projetoSelecionado!: Projeto;

  constructor(private messageService: MessageService) {}

  ngOnInit(): void {
    this.carregandoInformacoes.set(true);
    this.inicializaComponente();
  }

  async ngAfterViewInit(): Promise<void> {
    await this.inicializarBuscaColaboradores();
    await this.inicializarBuscaProjetos();
    this.carregandoInformacoes.set(false);
  }

  inicializaComponente(): void {
    this.dadosProjetoComponent.limparFormulario();
  }

  async inicializarBuscaColaboradores(query?: string): Promise<void> {
    this.dadosProjetoComponent.carregarTabela(true);
    await this.buscaColaboradores(query);
    this.tratarColaboradores();
    this.dadosProjetoComponent.preencheListaColaboradores(
      this.listaColaboradores
    );
    this.dadosProjetoComponent.carregarTabela(false);
  }

  async inicializarBuscaProjetos(): Promise<void> {
    await this.buscaProjetos();
    this.tratarProjetos();
    this.dadosProjetoComponent.preencheListaProejtos(this.listaProejtos);
  }

  async reinicializarComponente(): Promise<void> {
    window.location.reload();
  }

  tratarColaboradores(): void {
    if (this.listaColaboradores) {
      if (!Array.isArray(this.listaColaboradores))
        this.listaColaboradores = [this.listaColaboradores];

      this.listaColaboradores.forEach((colaborador) => {
        if (colaborador.projetos && !Array.isArray(colaborador.projetos))
          colaborador.projetos = [colaborador.projetos];
      });
    }
  }

  tratarProjetos(): void {
    if (this.listaProejtos) {
      if (!Array.isArray(this.listaProejtos))
        this.listaProejtos = [this.listaProejtos];

      this.listaProejtos = this.ordenarProjetosPorNome(this.listaProejtos);
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
      } else this.listaProejtos = projetos.outputData.projetos;
    } catch (error) {
      console.error(error);
      this.notificarErro(
        'Erro ao buscar a lista de projetos, tente mais tarde ou contate o admnistrador. ' +
          error
      );
      this.carregandoInformacoes.set(false);
    }
  }

  async buscaColaboradores(query?: string): Promise<void> {
    try {
      const body: CorpoBusca = {
        nTop: 10,
        nSkip: 0,
        aQuery: query,
      };
      const projetos = await firstValueFrom(
        this.informacoesColaboradorService.obterListaColaboradores(body)
      );
      if (projetos.outputData.message) {
        this.notificarErro(
          'Erro ao buscar a lista de colaboradores, ' +
            projetos.outputData.message
        );
      } else this.listaColaboradores = projetos.outputData.colaboradores;
    } catch (error) {
      console.error(error);
      this.notificarErro(
        'Erro ao buscar a lista de colaboradores, tente mais tarde ou contate o admnistrador. ' +
          error
      );
      this.carregandoInformacoes.set(false);
    }
  }

  receberProjetoSelecionado(projeto: Projeto): void {
    this.projetoSelecionado = projeto;
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

  async enviarSolicitacao(): Promise<void> {
    this.desabilitarFormulario(true);
    this.carregandoInformacoes.set(true);
    await this.gravarEnvio();
    this.carregandoInformacoes.set(false);
    this.desabilitarFormulario(false);
  }

  desabilitarFormulario(desabilitar: boolean): void {
    this.dadosProjetoComponent.desabilitarFormulario(desabilitar);
  }

  async gravarEnvio(): Promise<void> {
    await lastValueFrom(
      this.informacoesColaboradorService.gravarEnvio(this.montaCorpoEnvio())
    ).then(
      (data) => {
        if (data.outputData.message || data.outputData.ARetorno != 'OK') {
          this.notificarErro(
            'Erro ao gravar os colaboradores no projeto, ' +
              (data.outputData?.message || data.outputData?.ARetorno)
          );
          this.carregandoInformacoes.set(false);
        } else {
          this.notificarSucesso('Gravado com sucesso!');
          this.reinicializarComponente();
        }
      },
      () => {
        this.notificarErro(
          'Erro ao gravar os apontramentos, tente mais tarde ou contate o administrador'
        );
        this.carregandoInformacoes.set(false);
      }
    );
  }

  montaCorpoEnvio(): Persistencia {
    return {
      colaboradores: [],
      // this.colaboradoresVinculadosComponent.colaboradoresAdicionados.map(
      //   (colab) => {
      //     return {
      //       nEmpresa: Number(colab.NEmpresa),
      //       nTipoColaborador: Number(colab.NTipoColaborador),
      //       nMatricula: Number(colab.NMatricula),
      //       nTotalHoras: Number(colab.NHorasTotais),
      //       nCodigoProjeto: Number(colab.nIdProjetoVinculado),
      //     } as ColaboradoresPersistencia;
      //   }
      // ),
    };
  }
}
