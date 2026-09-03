import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import portfolioService from '../../services/portfolioService';
import paymentService from '../../services/paymentService';
import { useLanguage } from '../../context/LanguageContext';
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip } from 'recharts';
import { CircleAlert, ArrowLeft, Plus, Edit3, Calendar, Percent, RefreshCw, X, Trash2, TriangleAlert, History, TrendingUp } from 'lucide-react';

const ClientDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Delete client modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Delete investment modal states
  const [isDeleteInvestmentModalOpen, setIsDeleteInvestmentModalOpen] = useState(false);
  const [investmentToDelete, setInvestmentToDelete] = useState(null);
  const [isDeletingInvestment, setIsDeletingInvestment] = useState(false);

  // Delete payment modal states
  const [isDeletePaymentModalOpen, setIsDeletePaymentModalOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState(null);
  const [isDeletingPayment, setIsDeletingPayment] = useState(false);

  // Modal states
  const [isInvestmentModalOpen, setIsInvestmentModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvestmentId, setSelectedInvestmentId] = useState(null);
  const [selectedPaymentId, setSelectedPaymentId] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  // Form states - Investment
  const [principalAmount, setPrincipalAmount] = useState('');
  const [annualInterestRate, setAnnualInterestRate] = useState('');
  const [investmentStartDate, setInvestmentStartDate] = useState('');
  const [investmentType, setInvestmentType] = useState('YEARLY');
  const [investmentStatus, setInvestmentStatus] = useState('ACTIVE');
  const [rateChangeMode, setRateChangeMode] = useState('UPDATE_DIRECT'); // 'UPDATE_DIRECT' | 'REVISE'
  const [rateEffectiveFrom, setRateEffectiveFrom] = useState('');

  // Form states - Payment
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [paymentType, setPaymentType] = useState('INVESTMENT');
  const [paymentStatus, setPaymentStatus] = useState('PAID');
  const [paymentDescription, setPaymentDescription] = useState('');

  // Alert/Toast states
  const [toastMessage, setToastMessage] = useState(null);

  const fetchClientDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await portfolioService.getAdminClientById(id);
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to load client details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientDetails();
  }, [id]);

  const handleDeleteClient = async () => {
    setIsDeleting(true);
    try {
      await portfolioService.deleteClient(id);
      navigate('/admin/clients');
    } catch (err) {
      setError(err.message || 'Failed to delete client');
      setIsDeleteModalOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const openAddInvestmentModal = () => {
    setSelectedInvestmentId(null);
    setPrincipalAmount('');
    setAnnualInterestRate('12');
    setInvestmentStartDate(new Date().toISOString().split('T')[0]);
    setInvestmentType('YEARLY');
    setInvestmentStatus('ACTIVE');
    setRateChangeMode('UPDATE_DIRECT');
    setRateEffectiveFrom(new Date().toISOString().split('T')[0]);
    setIsInvestmentModalOpen(true);
  };

  const openEditInvestmentModal = (inv) => {
    setSelectedInvestmentId(inv._id);
    setPrincipalAmount(inv.principalAmount);
    setAnnualInterestRate(inv.calculations?.activeAnnualRate || inv.annualInterestRate);
    setInvestmentStartDate(new Date(inv.investmentStartDate).toISOString().split('T')[0]);
    setInvestmentType(inv.investmentType);
    setInvestmentStatus(inv.status);
    setRateChangeMode('REVISE');
    setRateEffectiveFrom(new Date().toISOString().split('T')[0]);
    setIsInvestmentModalOpen(true);
  };

  const openDeleteInvestmentModal = (inv, planNumber) => {
    setInvestmentToDelete({ ...inv, planNumber });
    setIsDeleteInvestmentModalOpen(true);
  };

  const handleDeleteInvestment = async () => {
    if (!investmentToDelete) return;
    setIsDeletingInvestment(true);
    try {
      await portfolioService.deleteInvestment(investmentToDelete._id);
      showToast(`Investment Plan #${investmentToDelete.planNumber} deleted successfully!`);
      setIsDeleteInvestmentModalOpen(false);
      setInvestmentToDelete(null);
      fetchClientDetails();
    } catch (err) {
      setError(err.message || 'Failed to delete investment plan');
      setIsDeleteInvestmentModalOpen(false);
    } finally {
      setIsDeletingInvestment(false);
    }
  };

  const handleInvestmentSubmit = async (e) => {
    e.preventDefault();
    setModalError('');
    
    if (!principalAmount || principalAmount <= 0) {
      return setModalError('Principal amount must be greater than 0');
    }
    if (!annualInterestRate || annualInterestRate < 0) {
      return setModalError('Interest rate cannot be negative');
    }
    if (selectedInvestmentId && rateChangeMode === 'REVISE' && !rateEffectiveFrom) {
      return setModalError('Effective date is required for rate revision');
    }

    setModalLoading(true);
    try {
      await portfolioService.addOrUpdateInvestment(id, {
        investmentId: selectedInvestmentId,
        principalAmount: Number(principalAmount),
        annualInterestRate: Number(annualInterestRate),
        investmentStartDate,
        investmentType,
        status: investmentStatus,
        rateChangeMode: selectedInvestmentId ? rateChangeMode : 'UPDATE_DIRECT',
        rateEffectiveFrom: selectedInvestmentId ? rateEffectiveFrom : investmentStartDate,
      });
      showToast(selectedInvestmentId ? 'Investment plan updated successfully!' : 'New investment plan added successfully!');
      setIsInvestmentModalOpen(false);
      fetchClientDetails();
    } catch (err) {
      setModalError(err.message || 'Failed to save investment details');
    } finally {
      setModalLoading(false);
    }
  };

  const openAddPaymentModal = () => {
    setSelectedPaymentId(null);
    setPaymentAmount('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentType('INVESTMENT');
    setPaymentStatus('PAID');
    setPaymentDescription('');
    setIsPaymentModalOpen(true);
  };

  const openEditPaymentModal = (p) => {
    setSelectedPaymentId(p._id);
    setPaymentAmount(p.amount);
    setPaymentDate(p.paymentDate ? new Date(p.paymentDate).toISOString().split('T')[0] : '');
    setPaymentType(p.paymentType);
    setPaymentStatus(p.status);
    setPaymentDescription(p.description || '');
    setIsPaymentModalOpen(true);
  };

  const openDeletePaymentModal = (p) => {
    setPaymentToDelete(p);
    setIsDeletePaymentModalOpen(true);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setModalError('');

    if (!paymentAmount || paymentAmount <= 0) {
      return setModalError('Payment amount must be greater than 0');
    }

    setModalLoading(true);
    try {
      const payload = {
        amount: Number(paymentAmount),
        paymentDate: paymentDate || new Date(),
        paymentType,
        status: paymentStatus,
        description: paymentDescription,
      };

      if (selectedPaymentId) {
        await paymentService.updateClientPayment(selectedPaymentId, payload);
        showToast('Payment transaction updated successfully!');
      } else {
        await paymentService.addClientPayment(id, payload);
        showToast('Payment transaction recorded successfully!');
      }

      setIsPaymentModalOpen(false);
      fetchClientDetails();
    } catch (err) {
      setModalError(err.message || 'Failed to save payment record');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeletePayment = async () => {
    if (!paymentToDelete) return;
    setIsDeletingPayment(true);
    try {
      await paymentService.deleteClientPayment(paymentToDelete._id);
      showToast('Payment transaction deleted successfully!');
      setIsDeletePaymentModalOpen(false);
      setPaymentToDelete(null);
      fetchClientDetails();
    } catch (err) {
      setError(err.message || 'Failed to delete payment record');
      setIsDeletePaymentModalOpen(false);
    } finally {
      setIsDeletingPayment(false);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Present';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="loading-spinner-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card-panel" style={{ textAlign: 'center', padding: '3rem' }}>
        <CircleAlert size={48} className="text-danger" style={{ marginBottom: '1rem' }} />
        <h3 className="panel-title" style={{ marginBottom: '0.5rem' }}>Error Loading Profile</h3>
        <p className="page-subtitle" style={{ marginBottom: '1.5rem' }}>{error}</p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link to="/admin/clients" className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <ArrowLeft size={16} /> Back to Directory
          </Link>
          <button onClick={fetchClientDetails} className="btn-primary" style={{ margin: 0 }}>
            <RefreshCw size={16} /> Retry
          </button>
        </div>
      </div>
    );
  }

  const { client, investments, payments, summary } = data || {};

  const activePrincipal = Math.max(0, (summary?.totalInvestment || 0) - (summary?.totalReceived || 0));
  const accruedProfit = summary?.totalProfit || 0;
  const totalReceived = summary?.totalReceived || 0;

  const pieData = [
    { name: language === 'en' ? 'Active Capital' : 'સક્રિય મૂડી', value: activePrincipal, color: '#06b6d4' },
    { name: language === 'en' ? 'Profit Earned' : 'કમાયેલ નફો', value: accruedProfit, color: '#10b981' },
    { name: language === 'en' ? 'Payouts Received' : 'મેળવેલ ચૂકવણી', value: totalReceived, color: '#f59e0b' },
  ].filter(item => item.value > 0);

  return (
    <div>
      {/* Toast Notifier */}
      {toastMessage && (
        <div className="toast-container">
          <div className={`toast ${toastMessage.type}`}>
            {toastMessage.message}
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link to="/admin/clients" className="btn-secondary" style={{ padding: '0.5rem', display: 'flex', alignItems: 'center' }}>
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="page-title">{client?.name}</h1>
            <p className="page-subtitle">Detailed financial profile, rate history, and transaction history.</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button onClick={openAddInvestmentModal} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={16} /> Add Investment
          </button>
          <button onClick={openAddPaymentModal} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 0 }}>
            <Plus size={16} /> Record Payment
          </button>
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              color: '#ef4444',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '0.5rem',
              padding: '0.5rem 1rem',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.875rem',
            }}
          >
            <Trash2 size={16} /> {t('deleteUser')}
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="detail-grid">
        {/* Left Column: Profile Summary & Investment Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Client Details */}
          <div className="card-panel">
            <h2 className="panel-title" style={{ marginBottom: '1rem' }}>Client Information</h2>
            <div className="detail-list">
              <div className="detail-item">
                <span className="detail-label">Name</span>
                <span className="detail-val">{client?.name}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Mobile Number</span>
                <span className="detail-val">{client?.mobileNumber}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Email Address</span>
                <span className="detail-val">{client?.email || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Registered Date</span>
                <span className="detail-val">{formatDate(client?.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Investment Details */}
          <div className="card-panel" style={{ maxHeight: '480px', overflowY: 'auto' }}>
            <h2 className="panel-title" style={{ marginBottom: '1rem' }}>Investment Information</h2>
            {investments && investments.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {investments.map((inv, idx) => (
                  <div key={inv._id} style={{ borderBottom: idx < investments.length - 1 ? '1px dashed var(--border-card)' : 'none', paddingBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: 600, color: 'var(--primary)', fontSize: '0.9rem' }}>
                        Plan #{idx + 1}
                      </span>
                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        <span className={`status-badge ${inv.status.toLowerCase()}`} style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem' }}>
                          {inv.status}
                        </span>
                        <button
                          onClick={() => openEditInvestmentModal(inv)}
                          className="btn-action-view"
                          style={{ fontSize: '0.75rem', padding: '0.15rem 0.45rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                        >
                          <Edit3 size={12} /> Change Rate / Edit
                        </button>
                        <button
                          onClick={() => openDeleteInvestmentModal(inv, idx + 1)}
                          style={{
                            background: 'rgba(239, 68, 68, 0.15)',
                            color: '#f87171',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '0.25rem',
                            padding: '0.15rem 0.45rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.2rem',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                          }}
                          title="Delete Investment Plan"
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    </div>
                    <div className="detail-list" style={{ gap: '0.4rem' }}>
                      <div className="detail-item" style={{ fontSize: '0.85rem' }}>
                        <span className="detail-label">Principal Amount</span>
                        <span className="detail-val">{formatCurrency(inv.principalAmount)}</span>
                      </div>
                      <div className="detail-item" style={{ fontSize: '0.85rem' }}>
                        <span className="detail-label">Individual Profit</span>
                        <span className="detail-val text-success">{formatCurrency(inv.calculations?.accruedInterest)}</span>
                      </div>
                      <div className="detail-item" style={{ fontSize: '0.85rem' }}>
                        <span className="detail-label">Individual Gain</span>
                        <span className="detail-val" style={{ fontWeight: 'bold' }}>{formatCurrency(inv.calculations?.individualGain)}</span>
                      </div>
                      <div className="detail-item" style={{ fontSize: '0.85rem' }}>
                        <span className="detail-label">Current Rate</span>
                        <span className="detail-val" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600, color: '#38bdf8' }}>
                          <Percent size={12} /> {inv.calculations?.activeAnnualRate || inv.annualInterestRate}% ({inv.investmentType})
                        </span>
                      </div>
                      <div className="detail-item" style={{ fontSize: '0.85rem' }}>
                        <span className="detail-label">Start Date</span>
                        <span className="detail-val" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Calendar size={12} className="text-secondary" /> {formatDate(inv.investmentStartDate)}
                        </span>
                      </div>
                    </div>

                    {/* Rate History Timeline Breakdown */}
                    {inv.rateHistory && inv.rateHistory.length > 0 && (
                      <div style={{ marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                          <History size={12} /> Rate Progression History
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                          {inv.rateHistory.map((rh, rhIdx) => (
                            <div key={rhIdx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', padding: '0.3rem 0.5rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '4px' }}>
                              <span style={{ color: 'var(--text-primary)' }}>
                                Period #{rhIdx + 1}: <strong>{rh.annualInterestRate}%</strong>
                              </span>
                              <span style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>
                                {formatDate(rh.effectiveFrom)} - {formatDate(rh.effectiveTo)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                  No active investment plan configured.
                </p>
                <button onClick={openAddInvestmentModal} className="btn-primary" style={{ margin: '0 auto', fontSize: '0.85rem' }}>
                  Setup Investment
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Calculations & Payment History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Calculations Summary */}
          <div className="card-panel">
            <h2 className="panel-title" style={{ marginBottom: '1rem' }}>Payment & Yield Summary</h2>
             <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', marginBottom: 0, gap: '1rem' }}>
              <div className="stats-card" style={{ padding: '1rem' }}>
                <span className="stats-title" style={{ fontSize: '0.75rem' }}>Total Principal</span>
                <span className="stats-value" style={{ fontSize: '1.25rem' }}>{formatCurrency(summary?.totalInvestment)}</span>
              </div>
              <div className="stats-card success" style={{ padding: '1rem' }}>
                <span className="stats-title" style={{ fontSize: '0.75rem' }}>Total Profit</span>
                <span className="stats-value" style={{ fontSize: '1.25rem' }}>{formatCurrency(summary?.totalProfit)}</span>
              </div>
              <div className="stats-card text-primary" style={{ padding: '1rem', borderLeftColor: 'var(--secondary)' }}>
                <span className="stats-title" style={{ fontSize: '0.75rem' }}>Total Gain</span>
                <span className="stats-value" style={{ fontSize: '1.25rem' }}>{formatCurrency((summary?.totalInvestment || 0) + (summary?.totalProfit || 0))}</span>
              </div>
              <div className="stats-card amber" style={{ padding: '1rem' }}>
                <span className="stats-title" style={{ fontSize: '0.75rem' }}>Total Paid</span>
                <span className="stats-value" style={{ fontSize: '1.25rem' }}>{formatCurrency(summary?.totalReceived)}</span>
              </div>
              <div className="stats-card rose" style={{ padding: '1rem' }}>
                <span className="stats-title" style={{ fontSize: '0.75rem' }}>Current Portfolio</span>
                <span className="stats-value" style={{ fontSize: '1.25rem' }}>{formatCurrency(summary?.portfolioValue)}</span>
              </div>
            </div>
          </div>

          {/* Portfolio Allocation Pie/Donut Chart */}
          <div className="card-panel">
            <div className="panel-header">
              <h2 className="panel-title">{language === 'en' ? 'Portfolio Allocation' : 'પોર્ટફોલિયો વિતરણ'}</h2>
              <span className="status-badge success">{language === 'en' ? 'Asset Mix' : 'સંપત્તિ મિશ્રણ'}</span>
            </div>
            <div style={{ width: '100%', height: 240, minHeight: 200, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
              {summary && summary.totalInvestment > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="45%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#0f172a', 
                        borderColor: 'rgba(255,255,255,0.1)',
                        color: '#f8fafc',
                        borderRadius: '8px'
                      }}
                      formatter={(val) => [formatCurrency(val), 'Amount']}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36} 
                      iconType="circle"
                      formatter={(value) => <span style={{ color: 'var(--text-primary)', fontSize: '0.8rem' }}>{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    {language === 'en' ? 'No Allocation Available' : 'કોઈ વિતરણ ઉપલબ્ધ નથી'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Payment History Table with Edit & Delete */}
          <div className="card-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 className="panel-title" style={{ margin: 0 }}>Transaction History</h2>
              <button onClick={openAddPaymentModal} className="btn-secondary" style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Plus size={12} /> Record Payment
              </button>
            </div>
            {payments && payments.length > 0 ? (
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Description</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p._id}>
                        <td>{formatDate(p.paymentDate)}</td>
                        <td style={{ fontWeight: 'bold' }}>{formatCurrency(p.amount)}</td>
                        <td>{p.paymentType}</td>
                        <td>
                          <span className={`status-badge ${p.status.toLowerCase()}`}>
                            {p.status}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                          {p.description || 'N/A'}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => openEditPaymentModal(p)}
                              style={{
                                background: 'rgba(59, 130, 246, 0.15)',
                                color: '#60a5fa',
                                border: '1px solid rgba(59, 130, 246, 0.3)',
                                borderRadius: '0.375rem',
                                padding: '0.25rem 0.5rem',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                fontSize: '0.75rem',
                                fontWeight: 500,
                              }}
                              title="Edit Transaction"
                            >
                              <Edit3 size={12} /> Edit
                            </button>
                            <button
                              onClick={() => openDeletePaymentModal(p)}
                              style={{
                                background: 'rgba(239, 68, 68, 0.15)',
                                color: '#f87171',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                borderRadius: '0.375rem',
                                padding: '0.25rem 0.5rem',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                fontSize: '0.75rem',
                                fontWeight: 500,
                              }}
                              title="Delete Transaction"
                            >
                              <Trash2 size={12} /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-secondary)' }}>
                No payment transactions recorded for this client.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* EDIT / REVISE INVESTMENT MODAL */}
      {isInvestmentModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 className="modal-title">{selectedInvestmentId ? 'Manage Investment / Rate Revision' : 'Add New Investment Plan'}</h3>
              <button className="modal-close" onClick={() => setIsInvestmentModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            {modalError && (
              <div className="alert-message alert-danger" style={{ marginBottom: '1rem' }}>
                <CircleAlert size={16} />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleInvestmentSubmit} className="auth-form">
              {selectedInvestmentId && (
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label>Update Action *</label>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                    <button
                      type="button"
                      onClick={() => setRateChangeMode('REVISE')}
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        borderRadius: '0.375rem',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        border: '1px solid',
                        borderColor: rateChangeMode === 'REVISE' ? '#38bdf8' : 'var(--border-color, #334155)',
                        backgroundColor: rateChangeMode === 'REVISE' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                        color: rateChangeMode === 'REVISE' ? '#38bdf8' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      <TrendingUp size={14} /> New Rate Revision (Effective Date)
                    </button>
                    <button
                      type="button"
                      onClick={() => setRateChangeMode('UPDATE_DIRECT')}
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        borderRadius: '0.375rem',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        border: '1px solid',
                        borderColor: rateChangeMode === 'UPDATE_DIRECT' ? '#38bdf8' : 'var(--border-color, #334155)',
                        backgroundColor: rateChangeMode === 'UPDATE_DIRECT' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                        color: rateChangeMode === 'UPDATE_DIRECT' ? '#38bdf8' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      <Edit3 size={14} /> Direct Edit Plan
                    </button>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.4rem', lineHeight: '1.4' }}>
                    {rateChangeMode === 'REVISE'
                      ? 'Rate Revision preserves all past earned gain and principal amount up to the effective date, applying the new percentage going forward.'
                      : 'Direct Edit updates base parameters (principal, initial start date, status) without adding historical rate periods.'}
                  </p>
                </div>
              )}

              <div className="form-group">
                <label>Principal Amount (₹) *</label>
                <input
                  type="number"
                  placeholder="e.g. 100000"
                  value={principalAmount}
                  onChange={(e) => setPrincipalAmount(e.target.value)}
                  disabled={modalLoading}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>{rateChangeMode === 'REVISE' && selectedInvestmentId ? 'New Interest Rate (%) *' : 'Annual Interest Rate (%) *'}</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 25"
                    value={annualInterestRate}
                    onChange={(e) => setAnnualInterestRate(e.target.value)}
                    disabled={modalLoading}
                    required
                  />
                </div>
                {selectedInvestmentId && rateChangeMode === 'REVISE' ? (
                  <div className="form-group">
                    <label>New Rate Effective Date *</label>
                    <input
                      type="date"
                      value={rateEffectiveFrom}
                      onChange={(e) => setRateEffectiveFrom(e.target.value)}
                      disabled={modalLoading}
                      required
                    />
                  </div>
                ) : (
                  <div className="form-group">
                    <label>Investment Type *</label>
                    <select
                      value={investmentType}
                      onChange={(e) => setInvestmentType(e.target.value)}
                      disabled={modalLoading}
                    >
                      <option value="YEARLY">Yearly</option>
                      <option value="MONTHLY">Monthly</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Plan Start Date *</label>
                  <input
                    type="date"
                    value={investmentStartDate}
                    onChange={(e) => setInvestmentStartDate(e.target.value)}
                    disabled={modalLoading}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Status *</label>
                  <select
                    value={investmentStatus}
                    onChange={(e) => setInvestmentStatus(e.target.value)}
                    disabled={modalLoading}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="PENDING">Pending</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setIsInvestmentModalOpen(false)}
                  className="btn-secondary"
                  disabled={modalLoading}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={modalLoading}>
                  {modalLoading ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Investment Plan Modal */}
      {isDeleteInvestmentModalOpen && investmentToDelete && (
        <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal-content" style={{ backgroundColor: 'var(--bg-card, #1e293b)', padding: '1.5rem', borderRadius: '0.75rem', maxWidth: '420px', width: '90%', border: '1px solid var(--border-color, #334155)' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444', margin: 0, fontSize: '1.1rem' }}>
                <TriangleAlert size={20} />
                Confirm Plan Deletion
              </h3>
              <button onClick={() => setIsDeleteInvestmentModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body" style={{ marginBottom: '1.5rem' }}>
              <p style={{ color: 'var(--text-secondary, #94a3b8)', fontSize: '0.95rem', margin: 0 }}>
                Are you sure you want to delete <strong>Plan #{investmentToDelete.planNumber}</strong>? This will remove its principal and accrued interest from overall calculations.
              </p>
              <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '0.5rem', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <strong style={{ color: 'var(--text-primary)', fontSize: '1.05rem' }}>Principal: {formatCurrency(investmentToDelete.principalAmount)}</strong>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  Interest Rate: {investmentToDelete.annualInterestRate}% ({investmentToDelete.investmentType})
                </div>
              </div>
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setIsDeleteInvestmentModalOpen(false)}
                className="btn-secondary"
                disabled={isDeletingInvestment}
                style={{ padding: '0.5rem 1rem', borderRadius: '0.375rem', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteInvestment}
                style={{ backgroundColor: '#ef4444', color: '#ffffff', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.375rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600 }}
                disabled={isDeletingInvestment}
              >
                {isDeletingInvestment ? 'Deleting...' : (
                  <>
                    <Trash2 size={16} />
                    Delete Plan
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECORD / EDIT PAYMENT MODAL */}
      {isPaymentModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">{selectedPaymentId ? 'Edit Payment Transaction' : 'Record Client Payment'}</h3>
              <button className="modal-close" onClick={() => setIsPaymentModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            {modalError && (
              <div className="alert-message alert-danger" style={{ marginBottom: '1rem' }}>
                <CircleAlert size={16} />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handlePaymentSubmit} className="auth-form">
              <div className="form-group">
                <label>Amount (₹) *</label>
                <input
                  type="number"
                  placeholder="e.g. 35000"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  disabled={modalLoading}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Payment Date *</label>
                  <input
                    type="date"
                    value={paymentDate || new Date().toISOString().split('T')[0]}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    disabled={modalLoading}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Payment Type *</label>
                  <select
                    value={paymentType}
                    onChange={(e) => setPaymentType(e.target.value)}
                    disabled={modalLoading}
                  >
                    <option value="INVESTMENT">Investment (Deposit)</option>
                    <option value="RETURN">Return (Distribution)</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Status *</label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value)}
                    disabled={modalLoading}
                  >
                    <option value="PAID">Paid</option>
                    <option value="PENDING">Pending</option>
                    <option value="FAILED">Failed</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Description / Notes</label>
                <textarea
                  placeholder="e.g. Bank Transfer Ref #91823"
                  value={paymentDescription}
                  onChange={(e) => setPaymentDescription(e.target.value)}
                  disabled={modalLoading}
                  rows="3"
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="btn-secondary"
                  disabled={modalLoading}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={modalLoading}>
                  {modalLoading ? 'Saving...' : (selectedPaymentId ? 'Update Payment' : 'Record Payment')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Payment Modal */}
      {isDeletePaymentModalOpen && paymentToDelete && (
        <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal-content" style={{ backgroundColor: 'var(--bg-card, #1e293b)', padding: '1.5rem', borderRadius: '0.75rem', maxWidth: '420px', width: '90%', border: '1px solid var(--border-color, #334155)' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444', margin: 0, fontSize: '1.1rem' }}>
                <TriangleAlert size={20} />
                Confirm Payment Deletion
              </h3>
              <button onClick={() => setIsDeletePaymentModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body" style={{ marginBottom: '1.5rem' }}>
              <p style={{ color: 'var(--text-secondary, #94a3b8)', fontSize: '0.95rem', margin: 0 }}>
                Are you sure you want to delete this recorded payment transaction? This will adjust the total paid amount and live portfolio balance.
              </p>
              <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '0.5rem', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <strong style={{ color: 'var(--text-primary)', fontSize: '1.05rem' }}>{formatCurrency(paymentToDelete.amount)}</strong>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  Date: {formatDate(paymentToDelete.paymentDate)} | Type: {paymentToDelete.paymentType}
                </div>
              </div>
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setIsDeletePaymentModalOpen(false)}
                className="btn-secondary"
                disabled={isDeletingPayment}
                style={{ padding: '0.5rem 1rem', borderRadius: '0.375rem', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeletePayment}
                style={{ backgroundColor: '#ef4444', color: '#ffffff', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.375rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600 }}
                disabled={isDeletingPayment}
              >
                {isDeletingPayment ? 'Deleting...' : (
                  <>
                    <Trash2 size={16} />
                    Delete Record
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Client Modal */}
      {isDeleteModalOpen && (
        <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal-content" style={{ backgroundColor: 'var(--bg-card, #1e293b)', padding: '1.5rem', borderRadius: '0.75rem', maxWidth: '420px', width: '90%', border: '1px solid var(--border-color, #334155)' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444', margin: 0, fontSize: '1.1rem' }}>
                <TriangleAlert size={20} />
                {t('deleteConfirmTitle')}
              </h3>
              <button onClick={() => setIsDeleteModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body" style={{ marginBottom: '1.5rem' }}>
              <p style={{ color: 'var(--text-secondary, #94a3b8)', fontSize: '0.95rem', margin: 0 }}>
                {t('deleteConfirmMessage')}
              </p>
              <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '0.5rem', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <strong style={{ color: 'var(--text-primary)' }}>{client?.name}</strong>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{client?.mobileNumber}</div>
              </div>
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="btn-secondary"
                disabled={isDeleting}
                style={{ padding: '0.5rem 1rem', borderRadius: '0.375rem', cursor: 'pointer' }}
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={handleDeleteClient}
                style={{ backgroundColor: '#ef4444', color: '#ffffff', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.375rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600 }}
                disabled={isDeleting}
              >
                {isDeleting ? t('loading') : (
                  <>
                    <Trash2 size={16} />
                    {t('delete')}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientDetails;
