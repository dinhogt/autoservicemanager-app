import { PrismaClient, RoleAdmin, StatusOs } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/** IDs fixos (UUID v4) para reprodutibilidade e vínculos explícitos no seed. */
const SEED_CLIENTE_IDS = [
  '550e8400-e29b-41d4-a716-446655440101',
  '550e8400-e29b-41d4-a716-446655440102',
  '550e8400-e29b-41d4-a716-446655440103',
  '550e8400-e29b-41d4-a716-446655440104',
  '550e8400-e29b-41d4-a716-446655440105',
  '550e8400-e29b-41d4-a716-446655440106',
] as const;

/** Um veículo por cliente; `SEED_VEICULO_IDS[i]` pertence a `SEED_CLIENTE_IDS[i]`. */
const SEED_VEICULO_IDS = [
  '550e8400-e29b-41d4-a716-446655440201',
  '550e8400-e29b-41d4-a716-446655440202',
  '550e8400-e29b-41d4-a716-446655440203',
  '550e8400-e29b-41d4-a716-446655440204',
  '550e8400-e29b-41d4-a716-446655440205',
  '550e8400-e29b-41d4-a716-446655440206',
] as const;

const SEED_SERVICO_IDS = [
  '550e8400-e29b-41d4-a716-446655440301',
  '550e8400-e29b-41d4-a716-446655440302',
  '550e8400-e29b-41d4-a716-446655440303',
  '550e8400-e29b-41d4-a716-446655440304',
  '550e8400-e29b-41d4-a716-446655440305',
  '550e8400-e29b-41d4-a716-446655440306',
  '550e8400-e29b-41d4-a716-446655440307',
  '550e8400-e29b-41d4-a716-446655440308',
  '550e8400-e29b-41d4-a716-446655440309',
  '550e8400-e29b-41d4-a716-44665544030a',
  '550e8400-e29b-41d4-a716-44665544030b',
  '550e8400-e29b-41d4-a716-44665544030c',
] as const;

const SEED_PECA_IDS = [
  '550e8400-e29b-41d4-a716-446655440401',
  '550e8400-e29b-41d4-a716-446655440402',
  '550e8400-e29b-41d4-a716-446655440403',
  '550e8400-e29b-41d4-a716-446655440404',
  '550e8400-e29b-41d4-a716-446655440405',
  '550e8400-e29b-41d4-a716-446655440406',
  '550e8400-e29b-41d4-a716-446655440407',
  '550e8400-e29b-41d4-a716-446655440408',
  '550e8400-e29b-41d4-a716-446655440409',
  '550e8400-e29b-41d4-a716-44665544040a',
  '550e8400-e29b-41d4-a716-44665544040b',
  '550e8400-e29b-41d4-a716-44665544040c',
] as const;

const SEED_USUARIO_IDS = [
  '550e8400-e29b-41d4-a716-446655440501',
  '550e8400-e29b-41d4-a716-446655440502',
  '550e8400-e29b-41d4-a716-446655440503',
  '550e8400-e29b-41d4-a716-446655440504',
] as const;

const SEED_OS_IDS = [
  '00000000-0000-4000-a000-000000000001',
  '00000000-0000-4000-a000-000000000002',
  '00000000-0000-4000-a000-000000000003',
  '00000000-0000-4000-a000-000000000004',
  '00000000-0000-4000-a000-000000000005',
  '00000000-0000-4000-a000-000000000006',
  '00000000-0000-4000-a000-000000000007',
] as const;

async function main(): Promise<void> {
  const senhaHash = await bcrypt.hash('Senha@1234', 10);

  // ── Usuarios (IDs fixos) ─────────────────────────────────────
  const usuarios = [
    {
      id: SEED_USUARIO_IDS[0],
      nome: 'João Silva',
      email: 'joao.silva@autoservice.local',
      role: RoleAdmin.ADMIN,
    },
    {
      id: SEED_USUARIO_IDS[1],
      nome: 'Maria Oliveira',
      email: 'maria.oliveira@autoservice.local',
      role: RoleAdmin.GERENTE,
    },
    {
      id: SEED_USUARIO_IDS[2],
      nome: 'Carlos Santos',
      email: 'carlos.santos@autoservice.local',
      role: RoleAdmin.MECANICO,
    },
    {
      id: SEED_USUARIO_IDS[3],
      nome: 'Ana Souza',
      email: 'ana.souza@autoservice.local',
      role: RoleAdmin.ATENDENTE,
    },
  ] as const;

  for (const u of usuarios) {
    await prisma.usuarioAdmin.upsert({
      where: { email: u.email },
      create: {
        id: u.id,
        nome: u.nome,
        email: u.email,
        senhaHash,
        role: u.role,
      },
      update: { nome: u.nome, role: u.role },
    });
  }
  console.log(`✔ ${usuarios.length} usuários criados/atualizados`);

  // ── Clientes (IDs fixos) ─────────────────────────────────────
  const clientesData = [
    {
      id: SEED_CLIENTE_IDS[0],
      nome: 'Roberto Almeida',
      cpfCnpj: '52998224725',
      contato: 'roberto.almeida@demo.autoservice.local',
      enderecos: 'Rua Augusta, 1200 - Consolação, São Paulo - SP, 01304-001',
    },
    {
      id: SEED_CLIENTE_IDS[1],
      nome: 'Fernanda Costa',
      cpfCnpj: '83749612580',
      contato: 'fernanda.costa@demo.autoservice.local',
      enderecos: 'Av. Paulista, 900 - Bela Vista, São Paulo - SP, 01310-100',
    },
    {
      id: SEED_CLIENTE_IDS[2],
      nome: 'Lucas Mendes',
      cpfCnpj: '19283746500',
      contato: 'lucas.mendes@demo.autoservice.local',
      enderecos:
        'Rua Copacabana, 350 - Copacabana, Rio de Janeiro - RJ, 22050-002',
    },
    {
      id: SEED_CLIENTE_IDS[3],
      nome: 'Patrícia Lima',
      cpfCnpj: '67451289034',
      contato: 'patricia.souza@demo.autoservice.local',
      enderecos:
        'Av. Afonso Pena, 1500 - Centro, Belo Horizonte - MG, 30130-003',
    },
    {
      id: SEED_CLIENTE_IDS[4],
      nome: 'Auto Peças Silva Ltda',
      cpfCnpj: '12345678000195',
      contato: 'contato@transportadora-demo.local',
      enderecos: 'Rua da Mooca, 2500 - Mooca, São Paulo - SP, 03104-002',
    },
    {
      id: SEED_CLIENTE_IDS[5],
      nome: 'Transportes Rápido Express',
      cpfCnpj: '98765432000188',
      contato: 'frota@logistica-demo.local',
      enderecos:
        'Rod. Anhanguera, Km 110 - Distrito Industrial, Campinas - SP, 13054-750',
    },
  ];

  const clientes = [];
  for (const { id, ...rest } of clientesData) {
    clientes.push(
      await prisma.cliente.upsert({
        where: { cpfCnpj: rest.cpfCnpj },
        create: { id, ...rest },
        update: {
          nome: rest.nome,
          contato: rest.contato,
          enderecos: rest.enderecos,
        },
      }),
    );
  }
  console.log(`✔ ${clientes.length} clientes criados/atualizados`);

  // ── Veículos: exatamente um por cliente (IDs fixos; clienteId = id real do upsert) ──
  const veiculosMeta = [
    {
      id: SEED_VEICULO_IDS[0],
      placa: 'BRA2E19',
      marca: 'Fiat',
      modelo: 'Uno 1.0 Fire',
      ano: 2019,
    },
    {
      id: SEED_VEICULO_IDS[1],
      placa: 'SPO4B67',
      marca: 'Chevrolet',
      modelo: 'Onix 1.0 Turbo LTZ',
      ano: 2023,
    },
    {
      id: SEED_VEICULO_IDS[2],
      placa: 'MER6D01',
      marca: 'Toyota',
      modelo: 'Corolla Cross XRE 2.0',
      ano: 2024,
    },
    {
      id: SEED_VEICULO_IDS[3],
      placa: 'CWB8F45',
      marca: 'Jeep',
      modelo: 'Renegade Sport 1.3 Turbo',
      ano: 2022,
    },
    {
      id: SEED_VEICULO_IDS[4],
      placa: 'IND1H89',
      marca: 'Fiat',
      modelo: 'Strada Freedom 1.3',
      ano: 2024,
    },
    {
      id: SEED_VEICULO_IDS[5],
      placa: 'LOG2J01',
      marca: 'Volkswagen',
      modelo: 'Saveiro Robust 1.6',
      ano: 2021,
    },
  ];

  const veiculos = [];
  for (let i = 0; i < veiculosMeta.length; i++) {
    const { id, placa, marca, modelo, ano } = veiculosMeta[i];
    const clienteId = clientes[i].id;
    veiculos.push(
      await prisma.veiculo.upsert({
        where: { placa },
        create: { id, clienteId, placa, marca, modelo, ano },
        update: {
          clienteId,
          marca,
          modelo,
          ano,
        },
      }),
    );
  }
  console.log(
    `✔ ${veiculos.length} veículos criados/atualizados (1 por cliente)`,
  );

  // ── Catálogo de Serviços (IDs fixos, upsert por id) ──────────
  const servicosPayload = [
    {
      id: SEED_SERVICO_IDS[0],
      descricao: 'Troca de óleo e filtro',
      precoBase: 150.0,
      tempoMedioExecucao: 30,
    },
    {
      id: SEED_SERVICO_IDS[1],
      descricao: 'Alinhamento e balanceamento',
      precoBase: 180.0,
      tempoMedioExecucao: 60,
    },
    {
      id: SEED_SERVICO_IDS[2],
      descricao: 'Revisão completa de freios',
      precoBase: 250.0,
      tempoMedioExecucao: 90,
    },
    {
      id: SEED_SERVICO_IDS[3],
      descricao: 'Troca de correia dentada',
      precoBase: 450.0,
      tempoMedioExecucao: 120,
    },
    {
      id: SEED_SERVICO_IDS[4],
      descricao: 'Diagnóstico eletrônico (scanner OBD-II)',
      precoBase: 120.0,
      tempoMedioExecucao: 45,
    },
    {
      id: SEED_SERVICO_IDS[5],
      descricao: 'Troca de amortecedores (par dianteiro)',
      precoBase: 600.0,
      tempoMedioExecucao: 150,
    },
    {
      id: SEED_SERVICO_IDS[6],
      descricao: 'Higienização do ar-condicionado',
      precoBase: 200.0,
      tempoMedioExecucao: 60,
    },
    {
      id: SEED_SERVICO_IDS[7],
      descricao: 'Troca de bateria',
      precoBase: 80.0,
      tempoMedioExecucao: 20,
    },
    {
      id: SEED_SERVICO_IDS[8],
      descricao: 'Troca de pastilhas de freio dianteiras',
      precoBase: 180.0,
      tempoMedioExecucao: 60,
    },
    {
      id: SEED_SERVICO_IDS[9],
      descricao: 'Troca de embreagem completa',
      precoBase: 800.0,
      tempoMedioExecucao: 240,
    },
    {
      id: SEED_SERVICO_IDS[10],
      descricao: 'Limpeza de bicos injetores',
      precoBase: 280.0,
      tempoMedioExecucao: 90,
    },
    {
      id: SEED_SERVICO_IDS[11],
      descricao: 'Troca de velas de ignição',
      precoBase: 100.0,
      tempoMedioExecucao: 40,
    },
  ] as const;

  const servicos = [];
  for (const row of servicosPayload) {
    const { id, descricao, precoBase, tempoMedioExecucao } = row;
    servicos.push(
      await prisma.servicoCatalogo.upsert({
        where: { id },
        create: { id, descricao, precoBase, tempoMedioExecucao },
        update: { descricao, precoBase, tempoMedioExecucao },
      }),
    );
  }
  console.log(`✔ ${servicos.length} serviços no catálogo`);

  // ── Peças em Estoque (IDs fixos + upsert por codigoInterno) ───
  const pecasPayload = [
    {
      id: SEED_PECA_IDS[0],
      descricao: 'Filtro de óleo – universal',
      precoUnitario: 35.0,
      quantidadeEmEstoque: 50,
      codigoInterno: 'FLT-OL-001',
    },
    {
      id: SEED_PECA_IDS[1],
      descricao: 'Pastilha de freio dianteira – cerâmica',
      precoUnitario: 120.0,
      quantidadeEmEstoque: 30,
      codigoInterno: 'PST-FR-D01',
    },
    {
      id: SEED_PECA_IDS[2],
      descricao: 'Correia dentada – portfólio multi-marca',
      precoUnitario: 180.0,
      quantidadeEmEstoque: 15,
      codigoInterno: 'COR-DT-001',
    },
    {
      id: SEED_PECA_IDS[3],
      descricao: 'Amortecedor dianteiro – pressurizado',
      precoUnitario: 280.0,
      quantidadeEmEstoque: 20,
      codigoInterno: 'AMR-DT-001',
    },
    {
      id: SEED_PECA_IDS[4],
      descricao: 'Bateria 60Ah – livre de manutenção',
      precoUnitario: 450.0,
      quantidadeEmEstoque: 10,
      codigoInterno: 'BAT-60-001',
    },
    {
      id: SEED_PECA_IDS[5],
      descricao: 'Óleo motor 5W30 sintético 1L',
      precoUnitario: 45.0,
      quantidadeEmEstoque: 100,
      codigoInterno: 'OLE-5W30-1L',
    },
    {
      id: SEED_PECA_IDS[6],
      descricao: 'Filtro de ar – motor aspirado',
      precoUnitario: 40.0,
      quantidadeEmEstoque: 40,
      codigoInterno: 'FLT-AR-001',
    },
    {
      id: SEED_PECA_IDS[7],
      descricao: 'Vela de ignição – iridium',
      precoUnitario: 25.0,
      quantidadeEmEstoque: 80,
      codigoInterno: 'VEL-IG-001',
    },
    {
      id: SEED_PECA_IDS[8],
      descricao: 'Disco de freio ventilado – dianteiro',
      precoUnitario: 200.0,
      quantidadeEmEstoque: 25,
      codigoInterno: 'DSC-FR-001',
    },
    {
      id: SEED_PECA_IDS[9],
      descricao: 'Kit embreagem completo',
      precoUnitario: 550.0,
      quantidadeEmEstoque: 8,
      codigoInterno: 'KIT-EMB-001',
    },
    {
      id: SEED_PECA_IDS[10],
      descricao: 'Lâmpada farol H4 – halógena',
      precoUnitario: 30.0,
      quantidadeEmEstoque: 60,
      codigoInterno: 'LMP-H4-001',
    },
    {
      id: SEED_PECA_IDS[11],
      descricao: 'Fluido de freio DOT4 500ml',
      precoUnitario: 25.0,
      quantidadeEmEstoque: 45,
      codigoInterno: 'FLD-FR-DOT4',
    },
  ] as const;

  for (const p of pecasPayload) {
    await prisma.pecaEstoque.upsert({
      where: { id: p.id },
      create: { ...p },
      update: {
        descricao: p.descricao,
        codigoInterno: p.codigoInterno,
        precoUnitario: p.precoUnitario,
        quantidadeEmEstoque: p.quantidadeEmEstoque,
      },
    });
  }
  console.log(`✔ ${pecasPayload.length} peças no estoque`);

  // ── Ordens de Serviço (FKs explícitas aos IDs fixos acima) ───
  await prisma.itemServicoOs.deleteMany({
    where: { ordemServicoId: { in: [...SEED_OS_IDS] } },
  });
  await prisma.itemPecaOs.deleteMany({
    where: { ordemServicoId: { in: [...SEED_OS_IDS] } },
  });
  await prisma.ordemServico.deleteMany({
    where: { id: { in: [...SEED_OS_IDS] } },
  });

  const S = SEED_SERVICO_IDS;
  const P = SEED_PECA_IDS;

  // OS 1 – RECEBIDA (Roberto + seu único veículo)
  await prisma.ordemServico.create({
    data: {
      id: SEED_OS_IDS[0],
      clienteId: clientes[0].id,
      veiculoId: veiculos[0].id,
      status: StatusOs.RECEBIDA,
      itensServico: {
        create: [
          {
            servicoCatalogoId: S[0],
            quantidade: 1,
            precoAplicado: 150.0,
          },
          {
            servicoCatalogoId: S[6],
            quantidade: 1,
            precoAplicado: 200.0,
          },
        ],
      },
      itensPeca: {
        create: [
          { pecaEstoqueId: P[0], quantidade: 1, precoUnitario: 35.0 },
          { pecaEstoqueId: P[5], quantidade: 4, precoUnitario: 45.0 },
        ],
      },
    },
  });

  // OS 2 – AGUARDANDO_APROVACAO (Fernanda + seu único veículo)
  await prisma.ordemServico.create({
    data: {
      id: SEED_OS_IDS[1],
      clienteId: clientes[1].id,
      veiculoId: veiculos[1].id,
      status: StatusOs.AGUARDANDO_APROVACAO,
      total: 750.0,
      itensServico: {
        create: [
          {
            servicoCatalogoId: S[2],
            quantidade: 1,
            precoAplicado: 250.0,
          },
          {
            servicoCatalogoId: S[1],
            quantidade: 1,
            precoAplicado: 180.0,
          },
        ],
      },
      itensPeca: {
        create: [
          { pecaEstoqueId: P[1], quantidade: 1, precoUnitario: 120.0 },
          {
            pecaEstoqueId: P[8],
            quantidade: 1,
            precoUnitario: 200.0,
            reservado: true,
          },
        ],
      },
    },
  });

  // OS 3 – EM_EXECUCAO (Lucas + seu único veículo)
  await prisma.ordemServico.create({
    data: {
      id: SEED_OS_IDS[2],
      clienteId: clientes[2].id,
      veiculoId: veiculos[2].id,
      status: StatusOs.EM_EXECUCAO,
      total: 1790.0,
      itensServico: {
        create: [
          {
            servicoCatalogoId: S[3],
            quantidade: 1,
            precoAplicado: 450.0,
          },
          {
            servicoCatalogoId: S[5],
            quantidade: 1,
            precoAplicado: 600.0,
          },
        ],
      },
      itensPeca: {
        create: [
          {
            pecaEstoqueId: P[2],
            quantidade: 1,
            precoUnitario: 180.0,
            reservado: true,
            baixado: true,
          },
          {
            pecaEstoqueId: P[3],
            quantidade: 2,
            precoUnitario: 280.0,
            reservado: true,
            baixado: false,
          },
        ],
      },
    },
  });

  // OS 4 – FINALIZADA (Patrícia + seu único veículo)
  await prisma.ordemServico.create({
    data: {
      id: SEED_OS_IDS[3],
      clienteId: clientes[3].id,
      veiculoId: veiculos[3].id,
      status: StatusOs.FINALIZADA,
      total: 1350.0,
      dataConclusao: new Date('2026-04-10T16:30:00Z'),
      itensServico: {
        create: [
          {
            servicoCatalogoId: S[9],
            quantidade: 1,
            precoAplicado: 800.0,
          },
        ],
      },
      itensPeca: {
        create: [
          {
            pecaEstoqueId: P[9],
            quantidade: 1,
            precoUnitario: 550.0,
            reservado: true,
            baixado: true,
          },
        ],
      },
    },
  });

  // OS 5 – ENTREGUE (Transportes + seu único veículo)
  await prisma.ordemServico.create({
    data: {
      id: SEED_OS_IDS[4],
      clienteId: clientes[5].id,
      veiculoId: veiculos[5].id,
      status: StatusOs.ENTREGUE,
      total: 685.0,
      dataConclusao: new Date('2026-04-08T14:00:00Z'),
      dataEntrega: new Date('2026-04-09T09:15:00Z'),
      itensServico: {
        create: [
          {
            servicoCatalogoId: S[0],
            quantidade: 1,
            precoAplicado: 150.0,
          },
          {
            servicoCatalogoId: S[4],
            quantidade: 1,
            precoAplicado: 120.0,
          },
          {
            servicoCatalogoId: S[11],
            quantidade: 1,
            precoAplicado: 100.0,
          },
        ],
      },
      itensPeca: {
        create: [
          {
            pecaEstoqueId: P[0],
            quantidade: 1,
            precoUnitario: 35.0,
            reservado: true,
            baixado: true,
          },
          {
            pecaEstoqueId: P[5],
            quantidade: 4,
            precoUnitario: 45.0,
            reservado: true,
            baixado: true,
          },
          {
            pecaEstoqueId: P[7],
            quantidade: 4,
            precoUnitario: 25.0,
            reservado: true,
            baixado: true,
          },
        ],
      },
    },
  });

  // OS 6 – EM_DIAGNOSTICO (Fernanda + mesmo veículo)
  await prisma.ordemServico.create({
    data: {
      id: SEED_OS_IDS[5],
      clienteId: clientes[1].id,
      veiculoId: veiculos[1].id,
      status: StatusOs.EM_DIAGNOSTICO,
      itensServico: {
        create: [
          {
            servicoCatalogoId: S[4],
            quantidade: 1,
            precoAplicado: 120.0,
          },
          {
            servicoCatalogoId: S[7],
            quantidade: 1,
            precoAplicado: 80.0,
          },
        ],
      },
      itensPeca: {
        create: [
          { pecaEstoqueId: P[4], quantidade: 1, precoUnitario: 450.0 },
        ],
      },
    },
  });

  // OS 7 – REJEITADA (Patrícia + mesmo veículo)
  await prisma.ordemServico.create({
    data: {
      id: SEED_OS_IDS[6],
      clienteId: clientes[3].id,
      veiculoId: veiculos[3].id,
      status: StatusOs.REJEITADA,
      total: 1440.0,
      itensServico: {
        create: [
          {
            servicoCatalogoId: S[5],
            quantidade: 1,
            precoAplicado: 600.0,
          },
          {
            servicoCatalogoId: S[10],
            quantidade: 1,
            precoAplicado: 280.0,
          },
        ],
      },
      itensPeca: {
        create: [{ pecaEstoqueId: P[3], quantidade: 2, precoUnitario: 280.0 }],
      },
    },
  });

  console.log(
    '✔ 7 ordens de serviço criadas (RECEBIDA, EM_DIAGNOSTICO, AGUARDANDO_APROVACAO, EM_EXECUCAO, FINALIZADA, ENTREGUE, REJEITADA)',
  );
  console.log('\nSeed concluído com sucesso!');
}

void main()
  .catch((e: unknown) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
