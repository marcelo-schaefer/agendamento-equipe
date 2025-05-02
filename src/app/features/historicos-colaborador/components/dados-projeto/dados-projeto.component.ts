import { Component, input, OnInit } from '@angular/core';
import { Colaborador } from '../../services/models/colaborador.model';
import { CardModule } from 'primeng/card';
import { Projeto, RetornoProjeto } from '../../services/models/projeto.model';
import { DropdownModule } from 'primeng/dropdown';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CommonModule } from '@angular/common';
import { InputSwitchModule } from 'primeng/inputswitch';
import { CalendarModule } from 'primeng/calendar';
import { MessagesModule } from 'primeng/messages';
import { ToastModule } from 'primeng/toast';
import { RippleModule } from 'primeng/ripple';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';

@Component({
  selector: 'app-dados-projeto',
  templateUrl: './dados-projeto.component.html',
  styleUrls: ['./dados-projeto.component.css'],
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
    InputNumberModule,
  ],
})
export class DadosProjetoComponent implements OnInit {
  listaProjetos: Projeto[] = [];
  projetoSelecionado!: Projeto;
  horasProjeto: number = 0;

  desabilitar = false;

  constructor() {}

  ngOnInit() {}

  preencheListaProejtos(projetos: Projeto[]): void {
    this.listaProjetos = projetos;
  }
}
