import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { useApp } from '../context/AppContext.jsx';
import { getLocalAiReply, sendAiChat } from '../utils/chat.js';

const QUICK_QUESTIONS = {
  id: [
    'Bagaimana cara mengajukan RFQ?',
    'Apa saja fitur di website ini?',
    'Bagaimana cara membuat akun?',
  ],
  en: [
    'How do I submit an RFQ?',
    'What features are available on this website?',
    'How do I create an account?',
  ],
};

function getPageContext(pathname) {
  if (pathname === '/') return 'home';
  if (pathname.startsWith('/produk')) return 'products';
  if (pathname.startsWith('/solusi')) return 'solutions';
  if (pathname.startsWith('/harga')) return 'pricing';
  if (pathname.startsWith('/transportasi') || pathname.startsWith('/logistik')) return 'transport';
  if (pathname.startsWith('/pelacakan') || pathname.startsWith('/lacak')) return 'tracking';
  return '';
}

export default function CustomerSupportChat() {
  const { lang, session } = useApp();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const sendingRef = useRef(false);
  const inputRef = useRef(null);
  const messagesRef = useRef(null);
  const isEnglish = lang === 'en';

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages, isSending]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  async function sendMessage(rawMessage) {
    const message = String(rawMessage || '').trim();
    if (!message || sendingRef.current) return;

    sendingRef.current = true;
    const history = messages.slice(-8).map(({ role, content }) => ({ role, content }));
    setMessages((current) => [...current, { role: 'user', content: message }]);
    setInput('');
    setIsSending(true);

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 10000);

    try {
      const result = await sendAiChat({
        message,
        lang,
        role: session?.role || 'guest',
        page: getPageContext(location.pathname),
        history,
        signal: controller.signal,
      });
      setMessages((current) => [...current, { role: 'assistant', content: result.reply }]);
    } catch {
      const fallback = getLocalAiReply({
        message,
        lang,
        role: session?.role || 'guest',
        page: getPageContext(location.pathname),
      });
      const notice = isEnglish
        ? 'The live chat service is unavailable, so here is an answer from the website guide:'
        : 'Layanan chat langsung sedang tidak tersedia. Berikut jawaban dari panduan website:';
      setMessages((current) => [...current, { role: 'assistant', content: `${notice}\n\n${fallback}` }]);
    } finally {
      window.clearTimeout(timeoutId);
      setIsSending(false);
      sendingRef.current = false;
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    sendMessage(input);
  }

  return (
    <div className={`nb-support-chat${isOpen ? ' is-open' : ''}`}>
      {isOpen && (
        <section
          id="nb-support-panel"
          className="nb-support-panel"
          role="dialog"
          aria-modal="false"
          aria-label={isEnglish ? 'NusaBridge website support chat' : 'Chat bantuan website NusaBridge'}
        >
          <header className="nb-support-header">
            <div className="nb-support-avatar" aria-hidden="true">N</div>
            <div className="nb-support-heading">
              <strong>NusaBridge AI</strong>
              <span>{isEnglish ? 'Website support' : 'Bantuan website'}</span>
            </div>
            <button
              className="nb-support-close"
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label={isEnglish ? 'Close chat' : 'Tutup chat'}
            >
              ×
            </button>
          </header>

          <div className="nb-support-messages" ref={messagesRef} aria-live="polite">
            {messages.length === 0 && (
              <div className="nb-support-message assistant">
                <p>
                  {isEnglish
                    ? 'Hello! I can help with NusaBridge website features, products, pricing, accounts, and RFQ steps.'
                    : 'Halo! Saya bisa membantu menjelaskan fitur website NusaBridge, produk, harga, akun, dan langkah RFQ.'}
                </p>
                <div className="nb-support-quick-questions">
                  {QUICK_QUESTIONS[isEnglish ? 'en' : 'id'].map((question) => (
                    <button
                      key={question}
                      type="button"
                      onClick={() => sendMessage(question)}
                      disabled={isSending}
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message, index) => (
              <div className={`nb-support-message ${message.role}`} key={`${index}-${message.role}`}>
                <p>{message.content}</p>
              </div>
            ))}

            {isSending && (
              <div className="nb-support-typing" role="status">
                {isEnglish ? 'Finding an answer…' : 'Sedang mencari jawaban…'}
              </div>
            )}
          </div>

          <form className="nb-support-form" onSubmit={handleSubmit}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  handleSubmit(event);
                }
              }}
              maxLength={1000}
              rows={1}
              placeholder={isEnglish ? 'Ask about this website…' : 'Tanyakan tentang website ini…'}
              aria-label={isEnglish ? 'Your question' : 'Pertanyaan Anda'}
              disabled={isSending}
            />
            <button type="submit" disabled={isSending || !input.trim()}>
              {isEnglish ? 'Send' : 'Kirim'}
            </button>
          </form>
          <p className="nb-support-note">
            {isEnglish
              ? 'Answers are limited to NusaBridge and export-import topics.'
              : 'Jawaban dibatasi pada NusaBridge dan topik ekspor-impor.'}
          </p>
        </section>
      )}

      <button
        className="nb-support-launcher"
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-controls="nb-support-panel"
        aria-label={isOpen
          ? (isEnglish ? 'Close support chat' : 'Tutup chat bantuan')
          : (isEnglish ? 'Open support chat' : 'Buka chat bantuan')}
      >
        {isOpen ? '×' : '💬'}
        {!isOpen && <span>{isEnglish ? 'Need help?' : 'Butuh bantuan?'}</span>}
      </button>
    </div>
  );
}
