export interface Feriado {
  data: string;
}

export interface RetornoFeriado {
  outputData: {
    feriados: Feriado[];
  };
}
