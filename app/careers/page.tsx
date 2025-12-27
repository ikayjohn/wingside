"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface JobPosition {
  id: string;
  title: string;
  location: string;
  overview: string | null;
  responsibilities: string[] | null;
  qualifications: string[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function CareersPage() {
  const [positions, setPositions] = useState<JobPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    experience: '',
    coverLetter: '',
  });
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  useEffect(() => {
    fetchPositions();
  }, []);

  async function fetchPositions() {
    try {
      const response = await fetch('/api/job-positions');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch positions');
      }

      setPositions(data.positions || []);
    } catch (error: any) {
      console.error('Error fetching positions:', error);
    } finally {
      setLoading(false);
    }
  }

  const whyWorkWithUs = [
    {
      title: 'Wingside Culture',
      description: 'We are a people centric company that uses technology as the fulcrum of our operations. The right team is important to us. At Wingside, we know that the best of employees ensure the best of customer experiences.',
    },
    {
      title: 'The Training Never Stops',
      description: "If you're looking for a place to grow in, thrive in, bloom in, excel in, learn new skills in, get new or stronger wings in (get it?), well, come on then.",
    },
    {
      title: 'Training',
      description: 'We know you already are awesome. We offer extensive trainings and self-development programs to hone all that awesomeness into skills and to help you excel at your job.',
    },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setResumeFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Create FormData for file upload
    const formDataToSend = new FormData();
    formDataToSend.append('fullName', formData.fullName);
    formDataToSend.append('email', formData.email);
    formDataToSend.append('phone', formData.phone);
    formDataToSend.append('experience', formData.experience);
    formDataToSend.append('coverLetter', formData.coverLetter);
    formDataToSend.append('jobPositionId', selectedJob!);

    if (resumeFile) {
      formDataToSend.append('resume', resumeFile);
    }

    try {
      const response = await fetch('/api/job-applications', {
        method: 'POST',
        body: formDataToSend,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit application');
      }

      setIsSubmitted(true);
    } catch (error: any) {
      alert(error.message || 'Failed to submit application. Please try again.');
    }
  };

  const selectedJobData = positions.find(job => job.id === selectedJob);

  return (
    <div className="min-h-screen bg-white">

      {/* Main Careers Page */}
      {!selectedJob && (
        <>
          {/* Hero Section */}
          <section className="careers-hero">
            <div className="careers-hero-container">
              <span className="careers-badge">Become a Wingsider</span>
              <h1 className="careers-hero-title">
                Join the <span className="text-yellow-400">Wingside</span> crew, where work<br />
                feels like play, well... not all of it
              </h1>
              <p className="careers-hero-description">
                At Wingside, we're all about three things; our food, our customers and our employees. Us Wingsiders have to stick together, you know. Our work environment is very important; structured to make sure work is enjoyable and brings about growth.
              </p>
              <p className="careers-hero-description">
                We believe the people that form our various teams are as important as the spices that grace our chicken wings. We are quite particular about creating lasting, fond impressions in the hearts of everyone that associates with the brand.
              </p>
              <p className="careers-hero-description">
                We're constantly on the lookout for vibrant and talented people to join our workforce. Think you just might have Wingsider qualities? Please, by all means, we'd like to meet you. Click the link below.
              </p>
              <button className="careers-hero-btn" onClick={() => document.getElementById('positions')?.scrollIntoView({ behavior: 'smooth' })}>
                Join the Team
              </button>
            </div>
          </section>

          {/* Why Work With Us Section */}
          <section className="careers-why-section">
            <div className="careers-why-container">
              <h2 className="careers-why-title">Why Work With us?</h2>
              <div className="careers-why-content">
                {whyWorkWithUs.map((item, index) => (
                  <div key={index} className="careers-why-item">
                    <h3 className="careers-why-item-title">{item.title}</h3>
                    <p className="careers-why-item-description">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="careers-cta-section">
            <div className="careers-cta-container">
              <div className="careers-cta-left">
                <h2 className="careers-cta-title">
                  The train never stops.<br />
                  Hop on, grow wings, and soar.
                </h2>
                <p className="careers-cta-subtitle">
                  Think you've got that <span className="text-yellow-400">WINGSIDER</span> spark?
                </p>
                <button className="careers-apply-btn" onClick={() => document.getElementById('positions')?.scrollIntoView({ behavior: 'smooth' })}>
                  Apply now
                </button>
              </div>
              <div className="careers-cta-right">
                <img src="/careers-team.jpg" alt="Wingside Team" className="careers-cta-image" />
              </div>
            </div>
          </section>

          {/* Open Positions Section */}
          <section id="positions" className="careers-positions-section">
            <div className="careers-positions-container">
              <h2 className="careers-positions-title">Open Positions</h2>
              <div className="careers-positions-list">
                {loading ? (
                  <div className="text-center py-12">
                    <div className="text-gray-500">Loading positions...</div>
                  </div>
                ) : positions.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No open positions at the moment. Check back soon!</p>
                  </div>
                ) : (
                  positions.map((job) => (
                    <button
                      key={job.id}
                      className="careers-position-card"
                      onClick={() => setSelectedJob(job.id)}
                    >
                      <span className="careers-position-title">{job.title}</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                      </svg>
                    </button>
                  ))
                )}
              </div>
            </div>
          </section>
        </>
      )}

      {/* Job Application Page */}
      {selectedJob && selectedJobData && (
        <section className="careers-apply-section">
          <div className="careers-apply-container">
            {/* Back Button */}
            <button className="careers-back-btn" onClick={() => { setSelectedJob(null); setIsSubmitted(false); }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              Back to Careers
            </button>

            {/* Job Header */}
            <h1 className="careers-apply-title">Apply for the position of a {selectedJobData.title}</h1>
            <div className="careers-apply-location">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              {selectedJobData.location}
            </div>

            {/* Job Details */}
            <div className="careers-job-details">
              <p className="careers-job-label">Job Title: {selectedJobData.title}</p>

              <h3 className="careers-job-heading">Overview</h3>
              <p className="careers-job-text">{selectedJobData.overview}</p>

              <h3 className="careers-job-heading">Key Responsibilities</h3>
              <ul className="careers-job-list">
                {selectedJobData.responsibilities.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>

              <h3 className="careers-job-heading">Qualifications</h3>
              <ul className="careers-job-list">
                {selectedJobData.qualifications.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>

            {/* Success Message */}
            {isSubmitted ? (
              <div className="careers-success-message">
                <h2 className="careers-success-title">Your application has been sent successfully.</h2>
                <p className="careers-success-text">We have received your message, Our team will get back to you shortly.</p>
                <Link href="/" className="careers-home-btn">Back to homepage</Link>
              </div>
            ) : (
              /* Application Form */
              <form onSubmit={handleSubmit} className="careers-form">
                <div className="careers-form-row">
                  <div className="careers-form-field">
                    <label className="careers-form-label">Full Name</label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      placeholder="Enter your full name"
                      className="careers-form-input"
                      required
                    />
                  </div>
                  <div className="careers-form-field">
                    <label className="careers-form-label">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter your email"
                      className="careers-form-input"
                      required
                    />
                  </div>
                </div>

                <div className="careers-form-row">
                  <div className="careers-form-field">
                    <label className="careers-form-label">Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+234 XXX XXX XXXX"
                      className="careers-form-input"
                      required
                    />
                  </div>
                  <div className="careers-form-field">
                    <label className="careers-form-label">Years of Experience</label>
                    <input
                      type="text"
                      name="experience"
                      value={formData.experience}
                      onChange={handleInputChange}
                      placeholder="Enter your experience"
                      className="careers-form-input"
                      required
                    />
                  </div>
                </div>

                <div className="careers-form-field">
                  <label className="careers-form-label">Upload Resume</label>
                  <div className="careers-upload-area">
                    <input
                      type="file"
                      id="resume"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileChange}
                      className="careers-upload-input"
                    />
                    <label htmlFor="resume" className="careers-upload-label">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="17 8 12 3 7 8"></polyline>
                        <line x1="12" y1="3" x2="12" y2="15"></line>
                      </svg>
                      <span><strong className="text-yellow-500">Click to upload</strong> or drag and drop</span>
                      <span className="careers-upload-hint">PDF, Docx (max. 5mb)</span>
                    </label>
                    {resumeFile && <p className="careers-upload-filename">{resumeFile.name}</p>}
                  </div>
                </div>

                <div className="careers-form-field">
                  <label className="careers-form-label">Cover Letter</label>
                  <textarea
                    name="coverLetter"
                    value={formData.coverLetter}
                    onChange={handleInputChange}
                    placeholder="Tell us why you are interested in this role and why you are good fit."
                    className="careers-form-textarea"
                    rows={5}
                  />
                </div>

                <button type="submit" className="careers-submit-btn">Submit</button>
              </form>
            )}
          </div>
        </section>
      )}

    </div>
  );
}
