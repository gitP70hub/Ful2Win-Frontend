import React, { useState } from 'react';
import { FiChevronDown, FiChevronUp, FiSend, FiX } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import BackgroundBubbles from '../components/BackgroundBubbles';

const SupportCenter = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('faq');
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    issueType: 'Bug',
    file: null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);

  const faqs = [
    {
      question: 'How to withdraw coins?',
      answer: 'Go to Wallet → Withdraw and follow on-screen steps.'
    },
    {
      question: 'How does matchmaking work?',
      answer: 'You’re paired with players of similar skill level.'
    },
    {
      question: 'How can I verify my account?',
      answer: 'Go to Profile → KYC Status to verify.'
    },
    {
      question: 'What if the app crashes?',
      answer: 'Restart or reinstall. Contact support if issue remains.'
    }
  ];

  const toggleFaq = (index) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFormData(prev => ({ ...prev, file: e.target.files[0] }));
    }
  };

  const removeFile = () => {
    setFormData(prev => ({ ...prev, file: null }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      alert('Please fill all fields');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setSubmitSuccess(true);
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
        issueType: 'Bug',
        file: null
      });
      setIsSubmitting(false);
      setTimeout(() => setSubmitSuccess(false), 5000);
    }, 1500);
  };

  return (
    <div
      className="min-h-screen p-4 sm:p-6 lg:p-8 relative text-white"
      style={{
        background: 'linear-gradient(to bottom, #0A2472 0%, #0D47A1 45%, #1565C0 100%)'
      }}
    >
      <BackgroundBubbles />

      {/* Navbar stays at top */}
      <Navbar title="Support Center" />

      {/* Main Glass Container */}
      <div className="backdrop-blur-md bg-white/10 rounded-2xl shadow-md border border-white/20 max-w-4xl mx-auto px-6 py-6 mt-6">

        <button
          onClick={() => navigate(-1)}
          className="text-blue-300 hover:text-white font-medium mb-4"
        >
          ← Back
        </button>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-amber-300 mb-2">Support Center</h1>
          <p className="text-blue-100">Need help? We're here for you.</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-400 mb-6">
          <button
            onClick={() => setActiveTab('faq')}
            className={`py-2 px-6 font-medium ${activeTab === 'faq' ? 'text-white border-b-2 border-white' : 'text-blue-200 hover:text-white'}`}
          >
            FAQs
          </button>
          <button
            onClick={() => setActiveTab('contact')}
            className={`py-2 px-6 font-medium ${activeTab === 'contact' ? 'text-white border-b-2 border-white' : 'text-blue-200 hover:text-white'}`}
          >
            Contact Support
          </button>
        </div>

        {/* FAQs */}
        {activeTab === 'faq' && (
          <div>
            {faqs.map((faq, index) => (
              <div key={index} className="mb-4">
                <button
                  className="w-full text-left p-4 bg-white/20 text-white rounded-xl shadow-sm flex justify-between items-center"
                  onClick={() => toggleFaq(index)}
                >
                  <span>{faq.question}</span>
                  {expandedFaq === index ? <FiChevronUp /> : <FiChevronDown />}
                </button>
                {expandedFaq === index && (
                  <div className="mt-2 text-sm text-blue-100 px-4">{faq.answer}</div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Contact Support */}
        {activeTab === 'contact' && (
          <form onSubmit={handleSubmit} className="space-y-6 mt-4">
            {submitSuccess && (
              <div className="bg-green-500/20 text-green-200 px-4 py-3 rounded-lg">
                ✅ Your support request has been submitted!
              </div>
            )}

            <input
              type="text"
              name="name"
              placeholder="Name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white placeholder:text-white/70"
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white placeholder:text-white/70"
            />
            <select
              name="issueType"
              value={formData.issueType}
              onChange={handleInputChange}
              className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white"
            >
              <option value="Bug">Bug</option>
              <option value="Payment Issue">Payment Issue</option>
              <option value="Account Issue">Account Issue</option>
              <option value="Other">Other</option>
            </select>
            {formData.issueType === 'Other' && (
              <input
                type="text"
                name="customIssue"
                placeholder="Describe your issue"
                value={formData.customIssue || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, customIssue: e.target.value }))
                }
                className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white placeholder:text-white/70"
              />
            )}
            <input
              type="text"
              name="subject"
              placeholder="Subject"
              value={formData.subject}
              onChange={handleInputChange}
              className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white placeholder:text-white/70"
            />
            <textarea
              name="message"
              rows="4"
              placeholder="Your message"
              value={formData.message}
              onChange={handleInputChange}
              className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white placeholder:text-white/70"
            ></textarea>
            <div className="flex items-center gap-4">
              <label className="cursor-pointer bg-white/20 px-4 py-2 rounded-lg text-sm border border-white/30">
                Upload File
                <input type="file" className="hidden" onChange={handleFileChange} />
              </label>
              {formData.file && (
                <div className="text-sm text-white flex items-center gap-2">
                  {formData.file.name}
                  <FiX className="cursor-pointer" onClick={removeFile} />
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-full font-semibold"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </form>
        )}

        {/* Footer */}
        <footer className="border-t border-gray-500 mt-10 pt-6 text-sm text-blue-100 text-center">
          <p>© {new Date().getFullYear()} Your Game Name. All rights reserved.</p>
          <div className="mt-3 space-x-4">
            <button
              onClick={() => setActiveTab('contact')}
              className="hover:text-white"
            >
              Contact Us
            </button>
            <button
              onClick={() => setShowAboutModal(true)}
              className="hover:text-white"
            >
              About Company
            </button>
          </div>
        </footer>

        {showAboutModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-[90%] max-w-sm text-center shadow-lg">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">About Our Company</h2>
              <p className="text-gray-600 mb-6">
                We are dedicated to providing the best gaming experience! Your satisfaction is our priority.
              </p>
              <button
                onClick={() => setShowAboutModal(false)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupportCenter;