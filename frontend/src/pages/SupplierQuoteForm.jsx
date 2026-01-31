import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import './SupplierQuoteForm.css'

const API_BASE_URL = '/api'

export default function SupplierQuoteForm() {
    const { token } = useParams()
    const navigate = useNavigate()

    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(false)
    const [formData, setFormData] = useState(null)
    const [quotationItems, setQuotationItems] = useState([])
    const [generalNotes, setGeneralNotes] = useState('')
    const [validUntil, setValidUntil] = useState('')
    const [quotationNumber, setQuotationNumber] = useState('')

    useEffect(() => {
        loadFormData()
    }, [token])

    const loadFormData = async () => {
        try {
            setLoading(true)
            const response = await axios.get(`${API_BASE_URL}/supplier-quotation/${token}`)
            setFormData(response.data)

            // Initialize quotation items with form structure
            setQuotationItems(response.data.items.map(item => ({
                materialId: item.materialId,
                materialName: item.materialName,
                materialCode: item.materialCode,
                quantity: item.quantity,
                unit: item.unit,
                notes: item.notes,
                unitPrice: '',
                deliveryDays: '',
                itemNotes: ''
            })))

            // Set default validUntil to 30 days from now
            const defaultValidDate = new Date()
            defaultValidDate.setDate(defaultValidDate.getDate() + 30)
            setValidUntil(defaultValidDate.toISOString().split('T')[0])
        } catch (err) {
            console.error('Error loading form:', err)
            setError(err.response?.data?.message || 'Form yüklenirken bir hata oluştu')
        } finally {
            setLoading(false)
        }
    }

    const handleItemChange = (index, field, value) => {
        const newItems = [...quotationItems]
        newItems[index][field] = value
        setQuotationItems(newItems)
    }

    const calculateTotal = () => {
        return quotationItems.reduce((sum, item) => {
            const price = parseFloat(item.unitPrice) || 0
            return sum + (price * item.quantity)
        }, 0)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        // Validate all items have prices
        const missingPrices = quotationItems.filter(item => !item.unitPrice || parseFloat(item.unitPrice) <= 0)
        if (missingPrices.length > 0) {
            alert('Lütfen tüm malzemeler için birim fiyat giriniz')
            return
        }

        try {
            setSubmitting(true)

            const submitData = {
                items: quotationItems.map(item => ({
                    materialId: item.materialId,
                    quantity: item.quantity,
                    unitPrice: parseFloat(item.unitPrice),
                    deliveryDays: item.deliveryDays ? parseInt(item.deliveryDays) : null,
                    notes: item.itemNotes || null
                })),
                validUntil: validUntil ? new Date(validUntil).toISOString() : null,
                currency: 'TRY',
                notes: generalNotes || null
            }

            const response = await axios.post(`${API_BASE_URL}/supplier-quotation/${token}`, submitData)
            setQuotationNumber(response.data.quotationNumber)
            setSuccess(true)
        } catch (err) {
            console.error('Error submitting:', err)
            alert(err.response?.data?.message || 'Teklif gönderilirken bir hata oluştu')
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="quote-form-container">
                <div className="quote-form-card loading">
                    <div className="spinner"></div>
                    <p>Form yükleniyor...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="quote-form-container">
                <div className="quote-form-card error">
                    <div className="error-icon">❌</div>
                    <h2>Hata</h2>
                    <p>{error}</p>
                </div>
            </div>
        )
    }

    if (success) {
        return (
            <div className="quote-form-container">
                <div className="quote-form-card success">
                    <div className="success-icon">✅</div>
                    <h2>Teklif Başarıyla Gönderildi!</h2>
                    <p>Teklifiniz kayıt altına alındı.</p>
                    <div className="success-details">
                        <p><strong>Teklif No:</strong> {quotationNumber}</p>
                        <p><strong>Toplam Tutar:</strong> {calculateTotal().toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</p>
                    </div>
                    <p className="thank-you">Teklifiniz için teşekkür ederiz!</p>
                </div>
            </div>
        )
    }

    return (
        <div className="quote-form-container">
            <div className="quote-form-card">
                {/* Header */}
                <div className="quote-form-header">
                    <h1>📝 Teklif Formu</h1>
                    <p>Talep No: <strong>{formData.requestNumber}</strong></p>
                </div>

                {/* Info Section */}
                <div className="quote-info-section">
                    <div className="info-grid">
                        <div className="info-item">
                            <span className="label">Tedarikçi</span>
                            <span className="value">{formData.supplierName}</span>
                        </div>
                        <div className="info-item">
                            <span className="label">Talep Tarihi</span>
                            <span className="value">{new Date(formData.requestDate).toLocaleDateString('tr-TR')}</span>
                        </div>
                        <div className="info-item">
                            <span className="label">İstenen Tarih</span>
                            <span className="value highlight">{formData.requiredDate ? new Date(formData.requiredDate).toLocaleDateString('tr-TR') : '-'}</span>
                        </div>
                    </div>
                    {formData.notes && (
                        <div className="request-notes">
                            <strong>📝 Talep Notları:</strong>
                            <p>{formData.notes}</p>
                        </div>
                    )}
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    {/* Materials Table */}
                    <div className="materials-section">
                        <h3>📦 Malzemeler</h3>
                        <div className="materials-table-wrapper">
                            <table className="materials-table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Kod</th>
                                        <th>Malzeme Adı</th>
                                        <th>Miktar</th>
                                        <th>Birim</th>
                                        <th>Birim Fiyat (₺)</th>
                                        <th>Toplam (₺)</th>
                                        <th>Teslim (Gün)</th>
                                        <th>Not</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {quotationItems.map((item, index) => (
                                        <tr key={item.materialId}>
                                            <td>{index + 1}</td>
                                            <td className="material-code">{item.materialCode}</td>
                                            <td className="material-name" title={item.materialName}>{item.materialName}</td>
                                            <td className="quantity">{item.quantity}</td>
                                            <td>{item.unit}</td>
                                            <td>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={item.unitPrice}
                                                    onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                                                    placeholder="0.00"
                                                    required
                                                    className="price-input"
                                                />
                                            </td>
                                            <td className="total-cell">
                                                {item.unitPrice ? (parseFloat(item.unitPrice) * item.quantity).toLocaleString('tr-TR', { minimumFractionDigits: 2 }) : '-'}
                                            </td>
                                            <td>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={item.deliveryDays}
                                                    onChange={(e) => handleItemChange(index, 'deliveryDays', e.target.value)}
                                                    placeholder="Gün"
                                                    className="delivery-input"
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="text"
                                                    value={item.itemNotes}
                                                    onChange={(e) => handleItemChange(index, 'itemNotes', e.target.value)}
                                                    placeholder="Not ekle..."
                                                    className="notes-input"
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td colSpan="6" className="total-label">Genel Toplam:</td>
                                        <td colSpan="3" className="grand-total">
                                            {calculateTotal().toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    {/* Additional Info */}
                    <div className="additional-section">
                        <div className="form-row">
                            <div className="form-group">
                                <label>Teklif Geçerlilik Tarihi</label>
                                <input
                                    type="date"
                                    value={validUntil}
                                    onChange={(e) => setValidUntil(e.target.value)}
                                    className="date-input"
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Genel Notlar</label>
                            <textarea
                                value={generalNotes}
                                onChange={(e) => setGeneralNotes(e.target.value)}
                                placeholder="Teslimat koşulları, ödeme şartları, özel notlar..."
                                rows="3"
                                className="notes-textarea"
                            />
                        </div>
                    </div>

                    {/* Submit */}
                    <div className="submit-section">
                        <button type="submit" disabled={submitting} className="submit-btn">
                            {submitting ? (
                                <>
                                    <span className="spinner-small"></span>
                                    Gönderiliyor...
                                </>
                            ) : (
                                <>✅ Teklifi Gönder</>
                            )}
                        </button>
                    </div>
                </form>

                {/* Footer */}
                <div className="quote-form-footer">
                    <p>Form geçerlilik: {formData.expiresAt ? new Date(formData.expiresAt).toLocaleDateString('tr-TR') : '-'}</p>
                </div>
            </div>
        </div>
    )
}
