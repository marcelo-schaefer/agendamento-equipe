export interface Projeto {
  NId: string;
  ANome: string;
  NHorasTotais: string;
  NDesvio: string;
  AOrigem: string;
}

export interface RetornoProjeto {
  outputData: {
    projetos: Projeto[];
    message: string;
  };
}
