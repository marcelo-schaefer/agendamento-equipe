import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { Colaborador, RetornoColaborador } from './models/colaborador.model';
import { RetornoGravacao } from './models/retorno-gravacao';
import { Persistencia } from './models/persistencia';
import { RetornoProjeto } from './models/projeto.model';

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
      service: 'com.senior.g5.rh.fp.EPO',
      port: '',
      user: '',
      password: '',
      rootObject: '',
    },
  };

  private http = inject(HttpClient);

  public obterInformacoesColaborador(): Observable<RetornoColaborador> {
    return this.http.post<RetornoColaborador>(environment.plugin.invoke, {
      ...this.basePayload,
      inputData: {
        ...this.basePayload.inputData,
      },
    });
  }

  public obterListaProjetos(): Observable<RetornoProjeto> {
    return this.http.post<RetornoProjeto>(environment.plugin.invoke, {
      ...this.basePayload,
      inputData: {
        ...this.basePayload.inputData,
        port: 'buscaProjetos',
      },
    });
  }

  public obterListaColaboradores(): Observable<RetornoColaborador> {
    return this.http.post<RetornoColaborador>(environment.plugin.invoke, {
      ...this.basePayload,
      inputData: {
        ...this.basePayload.inputData,
        port: 'buscaColaboradores',
        nTop: 'buscaColaboradores',
        nSkip: 'nSkip',
        aUsuarioSolicitante: 'nSkip',
      },
    });
  }

  public gravarEnvio(body: Persistencia): Observable<RetornoGravacao> {
    return this.http.post<RetornoGravacao>(environment.plugin.invoke, {
      ...this.basePayload,
      inputData: {
        ...this.basePayload.inputData,
        ...body,
        port: 'persisiteEPO',
      },
    });
  }
}
