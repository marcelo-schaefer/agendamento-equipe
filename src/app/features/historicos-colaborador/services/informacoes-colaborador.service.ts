import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, retry } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { Colaborador, RetornoColaborador } from './models/colaborador.model';
import { RetornoGravacao } from './models/retorno-gravacao';
import { Persistencia } from './models/persistencia';
import { RetornoProjeto } from './models/projeto.model';
import { CorpoBusca } from './models/corpo-busca';
import { BuscaLancamentos } from './models/busca-lancamentos';
import { RetornoLancamento } from './models/lancamento';
import { RetornoPapelAdm } from './models/papel-adm';
import { TokenService } from '../../../core/services/token.service';
import {
  BodyColaboradorePorData,
  RetornoColaboradoresPorData,
} from './models/colaboradorePorData';
import { RetornoFeriado } from './models/feriado';

@Injectable({
  providedIn: 'root',
})
export class InformacoesColaboradorService {
  private readonly basePayload = {
    id: 'f2200c3b-c7df-4040-9613-34f697b75889',
    inputData: {
      encryption: '3',
      server: 'https://ocweb03s1p.seniorcloud.com.br:31061/',
      module: 'rubi',
      service: 'com.senior.g5.rh.fp.agendaEquipe',
      port: '',
      user: '',
      password: '',
      rootObject: '',
    },
  };

  private http = inject(HttpClient);
  private tokenService = inject(TokenService);

  public obterListaProjetos(): Observable<RetornoProjeto> {
    return this.http
      .post<RetornoProjeto>(environment.plugin.invoke, {
        ...this.basePayload,
        inputData: {
          ...this.basePayload.inputData,
          port: 'buscaProjetos',
        },
      })
      .pipe(retry(3));
  }

  public obterListaColaboradores(
    body: CorpoBusca
  ): Observable<RetornoColaborador> {
    return this.http
      .post<RetornoColaborador>(environment.plugin.invoke, {
        ...this.basePayload,
        inputData: {
          ...this.basePayload.inputData,
          port: 'buscaColaboradores',
          ...body,
        },
      })
      .pipe(retry(3));
  }

  public obterListaFeriados(): Observable<RetornoFeriado> {
    return this.http
      .post<RetornoFeriado>(environment.plugin.invoke, {
        ...this.basePayload,
        inputData: {
          ...this.basePayload.inputData,
          port: 'buscaFeriados',
        },
      })
      .pipe(retry(3));
  }

  public buscaLancamentos(
    body: BuscaLancamentos
  ): Observable<RetornoLancamento> {
    return this.http.post<RetornoLancamento>(environment.plugin.invoke, {
      ...this.basePayload,
      inputData: {
        ...this.basePayload.inputData,
        port: 'buscaLancamentos',
        ...body,
      },
    });
  }

  public buscaColaboradoresPorDatas(
    body: BodyColaboradorePorData
  ): Observable<RetornoColaboradoresPorData> {
    return this.http.post<RetornoColaboradoresPorData>(
      environment.plugin.invoke,
      {
        ...this.basePayload,
        inputData: {
          ...this.basePayload.inputData,
          port: 'buscarColaboradoresEmProjetosPorDatas',
          ...body,
        },
      }
    );
  }

  public verificaPapel(): Observable<RetornoPapelAdm> {
    const aNomeUsuario = this.tokenService.username;
    return this.http
      .post<RetornoPapelAdm>(environment.plugin.invoke, {
        ...this.basePayload,
        inputData: {
          ...this.basePayload.inputData,
          port: 'verificaPapelSolicitante',
          aNomeUsuario: aNomeUsuario,
        },
      })
      .pipe(retry(3));
  }

  public gravarEnvio(body: Persistencia): Observable<RetornoGravacao> {
    return this.http.post<RetornoGravacao>(environment.plugin.invoke, {
      ...this.basePayload,
      inputData: {
        ...this.basePayload.inputData,
        ...body,
        port: 'persisiteAgendamento',
      },
    });
  }
}
