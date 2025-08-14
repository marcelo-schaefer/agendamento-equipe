import { Lancamento } from './lancamento';

export interface BodyColaboradorePorData {
  dDataInicio: string;
  dDataFim: string;
  colaboradoresBusca?: ColaboradoresParaBusca[];
  nTop?: number;
  nSkip?: number;
  aPapelAdm?: string;
}

export interface ColaboradoresParaBusca {
  nEmpresa: number;
  nTipoColaborador: number;
  nMatricula: number;
}

export interface RetornoColaboradoresPorData {
  outputData: {
    colaboradores: ColaboradoresPorData[];
    ARetorno: string;
    message: string;
  };
}

export interface ColaboradoresPorData {
  NEmpresa: string;
  NTipoColaborador: string;
  NMatricula: string;
  projetos: ProjetoPorData[];
}

export interface ProjetoPorData {
  NId: string;
  ANome: string;
  AFullTime: string;
  lancamentos: Lancamento[];
}
