/**
 * Data routes for CRUD operations
 */

const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { runQuery, getRow, getAllRows } = require('../database');

const router = express.Router();

// All data routes require authentication
router.use(authenticateToken);

/**
 * PESSOAS ROUTES
 */

// Get all pessoas for the authenticated user
router.get('/pessoas', async (req, res) => {
  try {
    const pessoas = await getAllRows(
      'SELECT * FROM pessoas WHERE user_id = ? ORDER BY nome',
      [req.user.userId]
    );

    res.json({ pessoas });
  } catch (error) {
    console.error('Get pessoas error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single pessoa by ID
router.get('/pessoas/:id', async (req, res) => {
  try {
    const pessoa = await getRow(
      'SELECT * FROM pessoas WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.userId]
    );

    if (!pessoa) {
      return res.status(404).json({ error: 'Pessoa not found' });
    }

    res.json({ pessoa });
  } catch (error) {
    console.error('Get pessoa error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new pessoa
router.post('/pessoas', async (req, res) => {
  try {
    const { id, nome, telefone, observacoes } = req.body;

    if (!id || !nome) {
      return res.status(400).json({ error: 'ID and nome are required' });
    }

    // Check if pessoa with this ID already exists for this user
    const existing = await getRow(
      'SELECT id FROM pessoas WHERE id = ? AND user_id = ?',
      [id, req.user.userId]
    );

    if (existing) {
      return res.status(409).json({ error: 'Pessoa with this ID already exists' });
    }

    await runQuery(
      'INSERT INTO pessoas (id, user_id, nome, telefone, observacoes) VALUES (?, ?, ?, ?, ?)',
      [id, req.user.userId, nome, telefone || null, observacoes || null]
    );

    const newPessoa = await getRow(
      'SELECT * FROM pessoas WHERE id = ? AND user_id = ?',
      [id, req.user.userId]
    );

    res.status(201).json({ 
      message: 'Pessoa created successfully',
      pessoa: newPessoa 
    });
  } catch (error) {
    console.error('Create pessoa error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update pessoa
router.put('/pessoas/:id', async (req, res) => {
  try {
    const { nome, telefone, observacoes } = req.body;

    if (!nome) {
      return res.status(400).json({ error: 'Nome is required' });
    }

    const result = await runQuery(
      'UPDATE pessoas SET nome = ?, telefone = ?, observacoes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
      [nome, telefone || null, observacoes || null, req.params.id, req.user.userId]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Pessoa not found' });
    }

    const updatedPessoa = await getRow(
      'SELECT * FROM pessoas WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.userId]
    );

    res.json({ 
      message: 'Pessoa updated successfully',
      pessoa: updatedPessoa 
    });
  } catch (error) {
    console.error('Update pessoa error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete pessoa
router.delete('/pessoas/:id', async (req, res) => {
  try {
    const result = await runQuery(
      'DELETE FROM pessoas WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.userId]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Pessoa not found' });
    }

    res.json({ message: 'Pessoa deleted successfully' });
  } catch (error) {
    console.error('Delete pessoa error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * CARTÕES ROUTES
 */

// Get all cartões for the authenticated user
router.get('/cartoes', async (req, res) => {
  try {
    const cartoes = await getAllRows(
      `SELECT c.*, p.nome as pessoa_nome 
       FROM cartoes c 
       LEFT JOIN pessoas p ON c.pessoa_id = p.id 
       WHERE c.user_id = ? 
       ORDER BY c.data_vencimento`,
      [req.user.userId]
    );

    res.json({ cartoes });
  } catch (error) {
    console.error('Get cartões error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get cartões by pessoa
router.get('/pessoas/:pessoaId/cartoes', async (req, res) => {
  try {
    const cartoes = await getAllRows(
      'SELECT * FROM cartoes WHERE pessoa_id = ? AND user_id = ? ORDER BY data_vencimento',
      [req.params.pessoaId, req.user.userId]
    );

    res.json({ cartoes });
  } catch (error) {
    console.error('Get cartões by pessoa error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single cartão by ID
router.get('/cartoes/:id', async (req, res) => {
  try {
    const cartao = await getRow(
      `SELECT c.*, p.nome as pessoa_nome 
       FROM cartoes c 
       LEFT JOIN pessoas p ON c.pessoa_id = p.id 
       WHERE c.id = ? AND c.user_id = ?`,
      [req.params.id, req.user.userId]
    );

    if (!cartao) {
      return res.status(404).json({ error: 'Cartão not found' });
    }

    res.json({ cartao });
  } catch (error) {
    console.error('Get cartão error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new cartão
router.post('/cartoes', async (req, res) => {
  try {
    const { 
      id, 
      pessoa_id, 
      descricao, 
      valor_total, 
      parcelas_totais, 
      parcelas_pagas = 0,
      valor_pago = 0,
      data_vencimento, 
      observacoes, 
      tipo_cartao = 'credito' 
    } = req.body;

    if (!id || !pessoa_id || !descricao || !valor_total || !parcelas_totais || !data_vencimento) {
      return res.status(400).json({ 
        error: 'ID, pessoa_id, descricao, valor_total, parcelas_totais, and data_vencimento are required' 
      });
    }

    // Verify pessoa exists and belongs to user
    const pessoa = await getRow(
      'SELECT id FROM pessoas WHERE id = ? AND user_id = ?',
      [pessoa_id, req.user.userId]
    );

    if (!pessoa) {
      return res.status(400).json({ error: 'Invalid pessoa_id' });
    }

    await runQuery(
      `INSERT INTO cartoes (
        id, pessoa_id, user_id, descricao, valor_total, parcelas_totais, 
        parcelas_pagas, valor_pago, data_vencimento, observacoes, tipo_cartao
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, pessoa_id, req.user.userId, descricao, valor_total, parcelas_totais,
        parcelas_pagas, valor_pago, data_vencimento, observacoes || null, tipo_cartao
      ]
    );

    const newCartao = await getRow(
      `SELECT c.*, p.nome as pessoa_nome 
       FROM cartoes c 
       LEFT JOIN pessoas p ON c.pessoa_id = p.id 
       WHERE c.id = ? AND c.user_id = ?`,
      [id, req.user.userId]
    );

    res.status(201).json({ 
      message: 'Cartão created successfully',
      cartao: newCartao 
    });
  } catch (error) {
    console.error('Create cartão error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update cartão
router.put('/cartoes/:id', async (req, res) => {
  try {
    const { 
      pessoa_id, 
      descricao, 
      valor_total, 
      parcelas_totais, 
      parcelas_pagas,
      valor_pago,
      data_vencimento, 
      observacoes, 
      tipo_cartao 
    } = req.body;

    if (!pessoa_id || !descricao || !valor_total || !parcelas_totais || !data_vencimento) {
      return res.status(400).json({ 
        error: 'pessoa_id, descricao, valor_total, parcelas_totais, and data_vencimento are required' 
      });
    }

    // Verify pessoa exists and belongs to user
    const pessoa = await getRow(
      'SELECT id FROM pessoas WHERE id = ? AND user_id = ?',
      [pessoa_id, req.user.userId]
    );

    if (!pessoa) {
      return res.status(400).json({ error: 'Invalid pessoa_id' });
    }

    const result = await runQuery(
      `UPDATE cartoes SET 
        pessoa_id = ?, descricao = ?, valor_total = ?, parcelas_totais = ?, 
        parcelas_pagas = ?, valor_pago = ?, data_vencimento = ?, observacoes = ?, 
        tipo_cartao = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ? AND user_id = ?`,
      [
        pessoa_id, descricao, valor_total, parcelas_totais, parcelas_pagas || 0,
        valor_pago || 0, data_vencimento, observacoes || null, tipo_cartao || 'credito',
        req.params.id, req.user.userId
      ]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Cartão not found' });
    }

    const updatedCartao = await getRow(
      `SELECT c.*, p.nome as pessoa_nome 
       FROM cartoes c 
       LEFT JOIN pessoas p ON c.pessoa_id = p.id 
       WHERE c.id = ? AND c.user_id = ?`,
      [req.params.id, req.user.userId]
    );

    res.json({ 
      message: 'Cartão updated successfully',
      cartao: updatedCartao 
    });
  } catch (error) {
    console.error('Update cartão error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete cartão
router.delete('/cartoes/:id', async (req, res) => {
  try {
    const result = await runQuery(
      'DELETE FROM cartoes WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.userId]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Cartão not found' });
    }

    res.json({ message: 'Cartão deleted successfully' });
  } catch (error) {
    console.error('Delete cartão error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Pay installment for a cartão
router.post('/cartoes/:id/pay-installment', async (req, res) => {
  try {
    const { installment_number } = req.body;

    if (!installment_number || installment_number < 1) {
      return res.status(400).json({ error: 'Valid installment_number is required' });
    }

    // Get current cartão
    const cartao = await getRow(
      'SELECT * FROM cartoes WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.userId]
    );

    if (!cartao) {
      return res.status(404).json({ error: 'Cartão not found' });
    }

    // Calculate new values
    const valorPorParcela = cartao.valor_total / cartao.parcelas_totais;
    const novoValorPago = cartao.valor_pago + valorPorParcela;
    const novasParcelasPagas = cartao.parcelas_pagas + 1;

    // Ensure we don't exceed the total
    if (novasParcelasPagas > cartao.parcelas_totais) {
      return res.status(400).json({ error: 'Cannot pay more installments than total' });
    }

    // Update cartão
    await runQuery(
      'UPDATE cartoes SET parcelas_pagas = ?, valor_pago = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
      [novasParcelasPagas, novoValorPago, req.params.id, req.user.userId]
    );

    const updatedCartao = await getRow(
      `SELECT c.*, p.nome as pessoa_nome 
       FROM cartoes c 
       LEFT JOIN pessoas p ON c.pessoa_id = p.id 
       WHERE c.id = ? AND c.user_id = ?`,
      [req.params.id, req.user.userId]
    );

    res.json({ 
      message: 'Installment paid successfully',
      cartao: updatedCartao 
    });
  } catch (error) {
    console.error('Pay installment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Unpay installment for a cartão (reverse payment)
router.post('/cartoes/:id/unpay-installment', async (req, res) => {
  try {
    const { installment_number } = req.body;

    if (!installment_number || installment_number < 1) {
      return res.status(400).json({ error: 'Valid installment_number is required' });
    }

    // Get current cartão
    const cartao = await getRow(
      'SELECT * FROM cartoes WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.userId]
    );

    if (!cartao) {
      return res.status(404).json({ error: 'Cartão not found' });
    }

    // Ensure we have paid installments to reverse
    if (cartao.parcelas_pagas <= 0) {
      return res.status(400).json({ error: 'No paid installments to reverse' });
    }

    // Calculate new values
    const valorPorParcela = cartao.valor_total / cartao.parcelas_totais;
    const novoValorPago = Math.max(0, cartao.valor_pago - valorPorParcela);
    const novasParcelasPagas = Math.max(0, cartao.parcelas_pagas - 1);

    // Update cartão
    await runQuery(
      'UPDATE cartoes SET parcelas_pagas = ?, valor_pago = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
      [novasParcelasPagas, novoValorPago, req.params.id, req.user.userId]
    );

    const updatedCartao = await getRow(
      `SELECT c.*, p.nome as pessoa_nome 
       FROM cartoes c 
       LEFT JOIN pessoas p ON c.pessoa_id = p.id 
       WHERE c.id = ? AND c.user_id = ?`,
      [req.params.id, req.user.userId]
    );

    res.json({ 
      message: 'Installment payment reversed successfully',
      cartao: updatedCartao 
    });
  } catch (error) {
    console.error('Unpay installment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GASTOS ROUTES
 */

// Get all gastos for the authenticated user
router.get('/gastos', async (req, res) => {
  try {
    const { startDate, endDate, categoria, metodo_pagamento } = req.query;
    
    let query = 'SELECT * FROM gastos WHERE user_id = ?';
    let params = [req.user.userId];

    // Add filters if provided
    if (startDate) {
      query += ' AND data >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      query += ' AND data <= ?';
      params.push(endDate);
    }
    
    if (categoria) {
      query += ' AND categoria = ?';
      params.push(categoria);
    }
    
    if (metodo_pagamento) {
      query += ' AND metodo_pagamento = ?';
      params.push(metodo_pagamento);
    }

    query += ' ORDER BY data DESC';

    const gastos = await getAllRows(query, params);

    res.json({ gastos });
  } catch (error) {
    console.error('Get gastos error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single gasto by ID
router.get('/gastos/:id', async (req, res) => {
  try {
    const gasto = await getRow(
      'SELECT * FROM gastos WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.userId]
    );

    if (!gasto) {
      return res.status(404).json({ error: 'Gasto not found' });
    }

    res.json({ gasto });
  } catch (error) {
    console.error('Get gasto error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new gasto
router.post('/gastos', async (req, res) => {
  try {
    const { 
      id, 
      descricao, 
      valor, 
      data, 
      categoria, 
      metodo_pagamento, 
      observacoes, 
      recorrente_id 
    } = req.body;

    if (!id || !descricao || !valor || !data || !categoria || !metodo_pagamento) {
      return res.status(400).json({ 
        error: 'ID, descricao, valor, data, categoria, and metodo_pagamento are required' 
      });
    }

    await runQuery(
      `INSERT INTO gastos (
        id, user_id, descricao, valor, data, categoria, 
        metodo_pagamento, observacoes, recorrente_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, req.user.userId, descricao, valor, data, categoria,
        metodo_pagamento, observacoes || null, recorrente_id || null
      ]
    );

    const newGasto = await getRow(
      'SELECT * FROM gastos WHERE id = ? AND user_id = ?',
      [id, req.user.userId]
    );

    res.status(201).json({ 
      message: 'Gasto created successfully',
      gasto: newGasto 
    });
  } catch (error) {
    console.error('Create gasto error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update gasto
router.put('/gastos/:id', async (req, res) => {
  try {
    const { 
      descricao, 
      valor, 
      data, 
      categoria, 
      metodo_pagamento, 
      observacoes, 
      recorrente_id 
    } = req.body;

    if (!descricao || !valor || !data || !categoria || !metodo_pagamento) {
      return res.status(400).json({ 
        error: 'descricao, valor, data, categoria, and metodo_pagamento are required' 
      });
    }

    const result = await runQuery(
      `UPDATE gastos SET 
        descricao = ?, valor = ?, data = ?, categoria = ?, 
        metodo_pagamento = ?, observacoes = ?, recorrente_id = ?, 
        updated_at = CURRENT_TIMESTAMP 
       WHERE id = ? AND user_id = ?`,
      [
        descricao, valor, data, categoria, metodo_pagamento, 
        observacoes || null, recorrente_id || null,
        req.params.id, req.user.userId
      ]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Gasto not found' });
    }

    const updatedGasto = await getRow(
      'SELECT * FROM gastos WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.userId]
    );

    res.json({ 
      message: 'Gasto updated successfully',
      gasto: updatedGasto 
    });
  } catch (error) {
    console.error('Update gasto error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete gasto
router.delete('/gastos/:id', async (req, res) => {
  try {
    const result = await runQuery(
      'DELETE FROM gastos WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.userId]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Gasto not found' });
    }

    res.json({ message: 'Gasto deleted successfully' });
  } catch (error) {
    console.error('Delete gasto error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * RECORRENCIAS ROUTES
 */

// Get all recorrencias for the authenticated user
router.get('/recorrencias', async (req, res) => {
  try {
    const { ativo } = req.query;
    
    let query = 'SELECT * FROM recorrencias WHERE user_id = ?';
    let params = [req.user.userId];

    if (ativo !== undefined) {
      query += ' AND ativo = ?';
      params.push(ativo === 'true' ? 1 : 0);
    }

    query += ' ORDER BY data_inicio DESC';

    const recorrencias = await getAllRows(query, params);

    res.json({ recorrencias });
  } catch (error) {
    console.error('Get recorrencias error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single recorrencia by ID
router.get('/recorrencias/:id', async (req, res) => {
  try {
    const recorrencia = await getRow(
      'SELECT * FROM recorrencias WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.userId]
    );

    if (!recorrencia) {
      return res.status(404).json({ error: 'Recorrencia not found' });
    }

    res.json({ recorrencia });
  } catch (error) {
    console.error('Get recorrencia error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new recorrencia
router.post('/recorrencias', async (req, res) => {
  try {
    const { 
      id, 
      descricao, 
      valor, 
      categoria, 
      metodo_pagamento, 
      frequencia, 
      data_inicio, 
      ultima_execucao,
      ativo = true,
      observacoes 
    } = req.body;

    if (!id || !descricao || !valor || !categoria || !metodo_pagamento || !frequencia || !data_inicio) {
      return res.status(400).json({ 
        error: 'ID, descricao, valor, categoria, metodo_pagamento, frequencia, and data_inicio are required' 
      });
    }

    await runQuery(
      `INSERT INTO recorrencias (
        id, user_id, descricao, valor, categoria, metodo_pagamento, 
        frequencia, data_inicio, ultima_execucao, ativo, observacoes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, req.user.userId, descricao, valor, categoria, metodo_pagamento,
        frequencia, data_inicio, ultima_execucao || null, ativo ? 1 : 0, observacoes || null
      ]
    );

    const newRecorrencia = await getRow(
      'SELECT * FROM recorrencias WHERE id = ? AND user_id = ?',
      [id, req.user.userId]
    );

    res.status(201).json({ 
      message: 'Recorrencia created successfully',
      recorrencia: newRecorrencia 
    });
  } catch (error) {
    console.error('Create recorrencia error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update recorrencia
router.put('/recorrencias/:id', async (req, res) => {
  try {
    const { 
      descricao, 
      valor, 
      categoria, 
      metodo_pagamento, 
      frequencia, 
      data_inicio, 
      ultima_execucao,
      ativo,
      observacoes 
    } = req.body;

    if (!descricao || !valor || !categoria || !metodo_pagamento || !frequencia || !data_inicio) {
      return res.status(400).json({ 
        error: 'descricao, valor, categoria, metodo_pagamento, frequencia, and data_inicio are required' 
      });
    }

    const result = await runQuery(
      `UPDATE recorrencias SET 
        descricao = ?, valor = ?, categoria = ?, metodo_pagamento = ?, 
        frequencia = ?, data_inicio = ?, ultima_execucao = ?, ativo = ?, 
        observacoes = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ? AND user_id = ?`,
      [
        descricao, valor, categoria, metodo_pagamento, frequencia, data_inicio,
        ultima_execucao || null, ativo ? 1 : 0, observacoes || null,
        req.params.id, req.user.userId
      ]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Recorrencia not found' });
    }

    const updatedRecorrencia = await getRow(
      'SELECT * FROM recorrencias WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.userId]
    );

    res.json({ 
      message: 'Recorrencia updated successfully',
      recorrencia: updatedRecorrencia 
    });
  } catch (error) {
    console.error('Update recorrencia error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete recorrencia
router.delete('/recorrencias/:id', async (req, res) => {
  try {
    const result = await runQuery(
      'DELETE FROM recorrencias WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.userId]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Recorrencia not found' });
    }

    res.json({ message: 'Recorrencia deleted successfully' });
  } catch (error) {
    console.error('Delete recorrencia error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Toggle recorrencia active status
router.post('/recorrencias/:id/toggle', async (req, res) => {
  try {
    const { ativo } = req.body;

    if (ativo === undefined) {
      return res.status(400).json({ error: 'ativo status is required' });
    }

    const result = await runQuery(
      'UPDATE recorrencias SET ativo = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
      [ativo ? 1 : 0, req.params.id, req.user.userId]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Recorrencia not found' });
    }

    const updatedRecorrencia = await getRow(
      'SELECT * FROM recorrencias WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.userId]
    );

    res.json({ 
      message: 'Recorrencia status updated successfully',
      recorrencia: updatedRecorrencia 
    });
  } catch (error) {
    console.error('Toggle recorrencia error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * USER SETTINGS ROUTES
 */

// Get user settings
router.get('/settings', async (req, res) => {
  try {
    const userSettings = await getRow(
      'SELECT settings FROM user_settings WHERE user_id = ?',
      [req.user.userId]
    );

    const settings = userSettings ? JSON.parse(userSettings.settings) : {};

    res.json({ settings });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user settings
router.put('/settings', async (req, res) => {
  try {
    const { settings } = req.body;

    if (!settings) {
      return res.status(400).json({ error: 'Settings object is required' });
    }

    const settingsJson = JSON.stringify(settings);

    // Try to update first, then insert if not exists
    const updateResult = await runQuery(
      'UPDATE user_settings SET settings = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
      [settingsJson, req.user.userId]
    );

    if (updateResult.changes === 0) {
      // Insert new settings record
      await runQuery(
        'INSERT INTO user_settings (user_id, settings) VALUES (?, ?)',
        [req.user.userId, settingsJson]
      );
    }

    res.json({ 
      message: 'Settings updated successfully',
      settings 
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * BULK SYNC ROUTES
 */

// Sync all user data (for initial sync or full backup)
router.post('/sync', async (req, res) => {
  try {
    const { 
      pessoas = [], 
      cartoes = [], 
      gastos = [], 
      recorrencias = [], 
      settings = {} 
    } = req.body;

    // Start transaction-like operations
    // Note: SQLite doesn't support nested transactions, so we'll do this sequentially

    // Clear existing data for this user (optional - you might want to merge instead)
    if (req.query.fullReplace === 'true') {
      await runQuery('DELETE FROM gastos WHERE user_id = ?', [req.user.userId]);
      await runQuery('DELETE FROM recorrencias WHERE user_id = ?', [req.user.userId]);
      await runQuery('DELETE FROM cartoes WHERE user_id = ?', [req.user.userId]);
      await runQuery('DELETE FROM pessoas WHERE user_id = ?', [req.user.userId]);
      await runQuery('DELETE FROM user_settings WHERE user_id = ?', [req.user.userId]);
    }

    // Insert pessoas
    for (const pessoa of pessoas) {
      await runQuery(
        'INSERT OR REPLACE INTO pessoas (id, user_id, nome, telefone, observacoes) VALUES (?, ?, ?, ?, ?)',
        [pessoa.id, req.user.userId, pessoa.nome, pessoa.telefone || null, pessoa.observacoes || null]
      );
    }

    // Insert cartões
    for (const cartao of cartoes) {
      await runQuery(
        `INSERT OR REPLACE INTO cartoes (
          id, pessoa_id, user_id, descricao, valor_total, parcelas_totais, 
          parcelas_pagas, valor_pago, data_vencimento, observacoes, tipo_cartao
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          cartao.id, cartao.pessoa_id, req.user.userId, cartao.descricao, 
          cartao.valor_total, cartao.parcelas_totais, cartao.parcelas_pagas || 0,
          cartao.valor_pago || 0, cartao.data_vencimento, cartao.observacoes || null, 
          cartao.tipo_cartao || 'credito'
        ]
      );
    }

    // Insert gastos
    for (const gasto of gastos) {
      await runQuery(
        `INSERT OR REPLACE INTO gastos (
          id, user_id, descricao, valor, data, categoria, 
          metodo_pagamento, observacoes, recorrente_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          gasto.id, req.user.userId, gasto.descricao, gasto.valor, gasto.data,
          gasto.categoria, gasto.metodo_pagamento, gasto.observacoes || null, 
          gasto.recorrente_id || null
        ]
      );
    }

    // Insert recorrências
    for (const recorrencia of recorrencias) {
      await runQuery(
        `INSERT OR REPLACE INTO recorrencias (
          id, user_id, descricao, valor, categoria, metodo_pagamento, 
          frequencia, data_inicio, ultima_execucao, ativo, observacoes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          recorrencia.id, req.user.userId, recorrencia.descricao, recorrencia.valor,
          recorrencia.categoria, recorrencia.metodo_pagamento, recorrencia.frequencia,
          recorrencia.data_inicio, recorrencia.ultima_execucao || null, 
          recorrencia.ativo ? 1 : 0, recorrencia.observacoes || null
        ]
      );
    }

    // Insert settings
    if (Object.keys(settings).length > 0) {
      const settingsJson = JSON.stringify(settings);
      await runQuery(
        'INSERT OR REPLACE INTO user_settings (user_id, settings) VALUES (?, ?)',
        [req.user.userId, settingsJson]
      );
    }

    res.json({ 
      message: 'Data synced successfully',
      synced: {
        pessoas: pessoas.length,
        cartoes: cartoes.length,
        gastos: gastos.length,
        recorrencias: recorrencias.length,
        settings: Object.keys(settings).length > 0
      }
    });

  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all user data (for sync download)
router.get('/sync', async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const [pessoas, cartoes, gastos, recorrencias, userSettings] = await Promise.all([
      getAllRows('SELECT * FROM pessoas WHERE user_id = ? ORDER BY nome', [userId]),
      getAllRows('SELECT * FROM cartoes WHERE user_id = ? ORDER BY data_vencimento', [userId]),
      getAllRows('SELECT * FROM gastos WHERE user_id = ? ORDER BY data DESC', [userId]),
      getAllRows('SELECT * FROM recorrencias WHERE user_id = ? ORDER BY created_at', [userId]),
      getRow('SELECT settings FROM user_settings WHERE user_id = ?', [userId])
    ]);

    const settings = userSettings ? JSON.parse(userSettings.settings) : {};

    res.json({
      data: {
        pessoas,
        cartoes,
        gastos,
        recorrencias,
        settings
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get sync data error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
