import { Colaborador } from './colaborador.model';

export interface Projeto {
  NId: string;
  ANome: string;
  DDataInicio: string;
  DDataFim: string;
  AStatus: string;
  colaboradores: Colaborador[];
}

export interface RetornoProjeto {
  outputData: {
    projetos: Projeto[];
    ARetorno: string;
    message: string;
  };
}
