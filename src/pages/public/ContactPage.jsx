import React, { useState } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { useToast } from '../../context/ToastContext';
import { Card } from '../../components/ui/Card';
import { Input, Textarea } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Phone, Mail, Clock, MessageSquare, MapPin, Send, Sparkles } from 'lucide-react';

export const ContactPage = () => {
  const { settings } = useSettings();
  const { success } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    service: 'Dry Cleaning',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const general = settings?.general || {};
  const hours = settings?.workingHours || {};
  const phone = general.primaryPhone || '+91 98765 43210';
  const whatsapp = (general.whatsappNumber || phone).replace(/\D/g, '');

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      success('Message Sent!', 'Our concierge team will get back to you shortly.');
      setFormData({ name: '', phone: '', email: '', service: 'Dry Cleaning', message: '' });
    }, 800);
  };

  return (
    <div className="py-12 sm:py-20 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand-50 border border-brand-200/80 text-brand-700 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>We are Here to Help</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 font-display tracking-tight">
            Contact Tech Wash Concierge
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-3 leading-relaxed">
            Have questions regarding garment care, corporate tie-ups, or doorstep scheduling? Reach out directly.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Contact Details Column */}
          <div className="lg:col-span-5 space-y-6">
            <Card variant="luxury" className="p-7 space-y-6">
              <h3 className="text-xl font-bold text-slate-900 font-display">
                Direct Contact Channels
              </h3>

              <div className="space-y-4 text-xs sm:text-sm text-slate-600">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Phone Support</div>
                    <a href={`tel:${phone}`} className="text-brand-700 hover:underline">{phone}</a>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">WhatsApp Concierge</div>
                    <a
                      href={`https://wa.me/${whatsapp}?text=${encodeURIComponent('Hello Tech Wash, I have an inquiry.')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-700 hover:underline"
                    >
                      Chat with Support
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-royal-50 text-royal-600 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Email Inquiries</div>
                    <a href={`mailto:${general.supportEmail || 'support@techwash.in'}`} className="text-royal-700 hover:underline">
                      {general.supportEmail || 'support@techwash.in'}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Operating Hours</div>
                    <div>{hours.weekdays || '8:00 AM - 9:00 PM'}</div>
                    <div className="text-[11px] text-slate-400">{hours.weeklyHolidays || 'Open 7 Days a Week'}</div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Contact Form Column */}
          <div className="lg:col-span-7">
            <Card variant="luxury" className="p-8 sm:p-10">
              <h3 className="text-xl font-bold text-slate-900 font-display mb-6">
                Send Us a Message
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Your Name *"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                  <Input
                    label="Mobile Number *"
                    required
                    type="tel"
                    placeholder="e.g. 9876543210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="e.g. rahul@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                      Service Interested In
                    </label>
                    <select
                      value={formData.service}
                      onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3.5 text-sm text-slate-800 focus:ring-2 focus:ring-brand-500"
                    >
                      <option value="Dry Cleaning">Premium Dry Cleaning</option>
                      <option value="Wash & Steam Iron">Wash & Steam Iron</option>
                      <option value="Shoe Spa">Luxury Shoe Care</option>
                      <option value="Couture & Lehengas">Bridal & Couture Care</option>
                      <option value="Corporate / Bulk">Corporate / Bulk Inquiry</option>
                    </select>
                  </div>
                </div>

                <Textarea
                  label="Message / Garment Details *"
                  required
                  rows={4}
                  placeholder="How can we assist you?"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full"
                  icon={Send}
                  isLoading={isSubmitting}
                >
                  Send Message
                </Button>
              </form>
            </Card>
          </div>

        </div>

      </div>
    </div>
  );
};
