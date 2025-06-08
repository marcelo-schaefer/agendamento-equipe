import {
  AfterViewInit,
  Component,
  EventEmitter,
  inject,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { BehaviorSubject, firstValueFrom, from, Observable, of } from 'rxjs';
import {
  debounceTime,
  filter,
  distinctUntilChanged,
  switchMap,
  take,
} from 'rxjs/operators';
import {
  FormGroup,
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { InformacoesColaboradorService } from '../../services/informacoes-colaborador.service';
import {
  Colaborador,
  RetornoColaborador,
} from '../../services/models/colaborador.model';
import { CorpoBusca } from '../../services/models/corpo-busca';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { CardModule } from 'primeng/card';
import {
  Dropdown,
  DropdownChangeEvent,
  DropdownModule,
} from 'primeng/dropdown';
import { InputSwitchModule } from 'primeng/inputswitch';
import { InputTextModule } from 'primeng/inputtext';
import { MessagesModule } from 'primeng/messages';
import { RippleModule } from 'primeng/ripple';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-busca-colaboradores',
  templateUrl: './busca-colaboradores.component.html',
  styleUrls: ['./busca-colaboradores.component.css'],
  standalone: true,
  imports: [
    CardModule,
    DropdownModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    InputSwitchModule,
    CalendarModule,
    MessagesModule,
    ToastModule,
    RippleModule,
  ],
})
export class BuscaColaboradoresComponent implements OnInit, AfterViewInit {
  @Output()
  colaboradorSelecionadoEmit: EventEmitter<Colaborador> =
    new EventEmitter<Colaborador>();

  @ViewChild('meuDropdown') dropdown!: Dropdown;

  private informacoesColaboradorService = inject(InformacoesColaboradorService);
  isLoadingColaboradores$ = new BehaviorSubject<boolean>(false);

  constructor(private fb: FormBuilder) {}

  searchChange$ = new BehaviorSubject('');
  desabilitar = false;
  inicializando = false;
  isEndColaboradores = false;
  colaboradoresDesabilitados = false;
  search = '';
  top = 10;
  skip = 0;
  colaborador: Colaborador;
  colaboradores: Colaborador[] = [];

  formDadosSolicitacao: FormGroup;

  ngOnInit(): void {
    this.searchChange$
      .asObservable()
      .pipe(
        debounceTime(500),
        filter((query) => query.length >= 2 || query.length === 0),
        distinctUntilChanged(),
        switchMap((query) =>
          query
            ? from(this.searchLoadColaboradores(query))
            : from(of({ outputData: { colaboradores: this.colaboradores } }))
        )
      )
      .subscribe((colaboradores: RetornoColaborador) => {
        this.colaboradores = colaboradores.outputData.colaboradores || [];
        this.tratarColaboradores();
        if (!this.inicializando) this.dropdown.show();
        this.isLoadingColaboradores$.next(false);
      });

    this.buildForm();
    this.opcoesIniciais();
  }

  ngAfterViewInit(): void {
    this.isLoadingColaboradores$.subscribe((loading) => {
      if (loading) {
        this.dropdown.hide();
      }
    });
  }

  limparFormulario(): void {
    if (
      this.formDadosSolicitacao &&
      this.formDadosSolicitacao.get('colaboradorSelecionado')
    )
      this.formDadosSolicitacao.get('colaboradorSelecionado').setValue(null);
  }

  inicializarListaColaboradores(colaboradores: Colaborador[]): void {
    this.colaboradores = colaboradores;
    this.skip += this.top;
  }

  buildForm(): void {
    this.formDadosSolicitacao = this.fb.group({
      colaboradorSelecionado: null,
      colaboradoresArray: this.fb.array([]),
    });
  }

  tratarColaboradores(): void {
    if (this.colaboradores) {
      if (!Array.isArray(this.colaboradores))
        this.colaboradores = [this.colaboradores];

      this.colaboradores.forEach((colaborador) => {
        if (colaborador.projetos && !Array.isArray(colaborador.projetos))
          colaborador.projetos = [colaborador.projetos];
      });
    }
  }

  selecionaColaborador(event: DropdownChangeEvent): void {
    const colaborador = event.value;
    if (colaborador) {
      this.colaborador = colaborador;
      this.colaboradorSelecionadoEmit.emit(colaborador);
    }
  }

  searchLoadColaboradores(search: string): Observable<RetornoColaborador> {
    this.isLoadingColaboradores$.next(true);
    this.cleanSelect();
    this.search = search;
    return this.loadColaboradores();
  }

  cleanSelect(): void {
    this.colaboradores = [];
    this.top = 10;
    this.skip = 0;
    this.isEndColaboradores = false;
  }

  loadColaboradores(): Observable<RetornoColaborador> {
    if (!this.isEndColaboradores) {
      this.isLoadingColaboradores$.next(true);
      const search: CorpoBusca = {
        nTop: this.top,
        nSkip: this.skip,
        aQuery: this.search,
      };
      const colaboradores =
        this.informacoesColaboradorService.obterListaColaboradores(search);

      this.skip += this.top;
      return colaboradores;
    }
    return of(new RetornoColaborador());
  }

  onSearch(search: string): void {
    this.searchChange$.next(search);
  }

  onScrollToBottom(): void {
    if (!this.isEndColaboradores) {
      this.loadColaboradores()
        .pipe(take(1))
        .subscribe((colaboradores) => {
          if (
            colaboradores &&
            colaboradores.outputData.colaboradores.length < this.top
          ) {
            this.isEndColaboradores = true;
          }

          this.colaboradores = this.colaboradores.concat(
            colaboradores.outputData.colaboradores
          );
          this.isLoadingColaboradores$.next(false);
        });
    }
  }

  opcoesIniciais(): void {
    this.inicializando = true;
    const colaboradores = firstValueFrom(this.loadColaboradores());

    colaboradores.then((colaboradores) => {
      if (
        colaboradores &&
        colaboradores.outputData.colaboradores.length < this.top
      ) {
        this.isEndColaboradores = true;
      }

      this.colaboradores = this.colaboradores.concat(
        colaboradores.outputData.colaboradores
      );
      this.tratarColaboradores();
      this.inicializando = false;
    });
  }

  getOptionLabel(): string {
    return `${this.colaborador?.NMatricula} - ${this.colaborador?.ANome}`;
  }

  compareColaborador(c1: Colaborador, c2: Colaborador): boolean {
    return c1 && c2
      ? c1.NMatricula === c2.NMatricula &&
          c1.NTipoColaborador === c2.NTipoColaborador &&
          c1.NEmpresa === c2.NEmpresa
      : c1 === c2;
  }

  desabilitarFormulario(desabilitar: boolean): void {
    this.desabilitar = desabilitar;
  }
}
