import { DataApontamento } from './data-apontamento';
import { Projeto } from './projeto.model';

export interface Colaborador {
  NEmpresa: string;
  NTipoColaborador: string;
  NMatricula: string;
  ANome: string;
  NHorasTotais: string;
  NHorasApontadas: string;
  NDesvio: string;
  incluido?: boolean;
}

export interface RetornoColaborador {
  outputData: Colaborador;
}
