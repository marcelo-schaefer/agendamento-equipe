export interface Persistencia {
  colaboradores: ColaboradoresPersistencia[];
}

export interface ColaboradoresPersistencia {
  nEmpresa: number;
  nTipoColaborador: number;
  nMatricula: number;
  nCodigoProjeto: number;
  aFullTime: string;
  dData: string;
  aTipoLAncamento: string;
}
