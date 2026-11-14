INSERT INTO Cliente (id,nome,cpfCnpj,contato,ativo,createdAt,updatedAt)
VALUES ('phase4-client','Cliente BDD','11144477735','bdd@autoservice.local',1,NOW(),NOW())
ON DUPLICATE KEY UPDATE updatedAt=NOW();

INSERT INTO Veiculo (id,clienteId,placa,marca,modelo,ativo,createdAt,updatedAt)
VALUES ('phase4-vehicle','phase4-client','BDD4E22','FIAP','E2E',1,NOW(),NOW())
ON DUPLICATE KEY UPDATE updatedAt=NOW();

INSERT INTO OrdemServico (id,clienteId,veiculoId,status,total,dataCriacao)
VALUES
('00000000-0000-4000-a000-000000000001','phase4-client','phase4-vehicle','RECEBIDA',100,NOW()),
('00000000-0000-4000-a000-000000000002','phase4-client','phase4-vehicle','RECEBIDA',100,NOW()),
('00000000-0000-4000-a000-000000000003','phase4-client','phase4-vehicle','RECEBIDA',100,NOW()),
('00000000-0000-4000-a000-000000000004','phase4-client','phase4-vehicle','RECEBIDA',100,NOW()),
('00000000-0000-4000-a000-000000000005','phase4-client','phase4-vehicle','RECEBIDA',100,NOW()),
('00000000-0000-4000-a000-000000000006','phase4-client','phase4-vehicle','RECEBIDA',100,NOW())
ON DUPLICATE KEY UPDATE status='RECEBIDA', total=100;
