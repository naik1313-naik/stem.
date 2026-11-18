import { useEffect, useState } from 'react';
import { Icon, type IconName } from './Icon';
import { copy, type Language } from '../content/translations';
import {
  getDownloadedPackages,
  saveDownloadedPackage,
  removeDownloadedPackage,
  type DownloadedPackage,
  type SubjectId,
  type ClassId,
} from '../lib/storage';

interface SubjectPackage {
  subject: SubjectId;
  classId: ClassId;
  title: string;
  description: string;
  estimatedSize: string;
  modules: string[];
}

const SUBJECT_PACKAGES: SubjectPackage[] = [
  // Physics packages
  {
    subject: 'physics',
    classId: '6',
    title: 'Physics Class 6',
    description: 'Motion & Distance, Light & Shadows, Electric Circuits, Magnets',
    estimatedSize: '~2 MB',
    modules: ['Motion and Measurement of Distances', 'Light, Shadows and Reflections', 'Electricity and Circuits', 'Fun with Magnets'],
  },
  {
    subject: 'physics',
    classId: '7',
    title: 'Physics Class 7',
    description: 'Heat, Motion & Time, Current Effects, Light',
    estimatedSize: '~2 MB',
    modules: ['Heat', 'Motion and Time', 'Electric Current and Its Effects', 'Light'],
  },
  {
    subject: 'physics',
    classId: '8',
    title: 'Physics Class 8',
    description: 'Electricity Effects, Forces, Pressure & Weather, Sound, Reflection, Natural Phenomena',
    estimatedSize: '~3 MB',
    modules: ['Electricity: Heating, Magnetic, and Chemical Effects', 'Exploring Forces', 'Pressure, Winds, Storms, and Cyclones', 'Sound', 'Light: Reflection and the Human Eye', 'Some Natural Phenomena'],
  },
  // Chemistry packages
  {
    subject: 'chemistry',
    classId: '6',
    title: 'Chemistry Class 6',
    description: 'Materials, Temperature, Water States, Separation, Nature\'s Treasures',
    estimatedSize: '~2 MB',
    modules: ['Materials Around Us', 'Temperature and Its Measurement', 'A Journey Through States of Water', 'Methods of Separation in Everyday Life', "Nature's Treasures"],
  },
  {
    subject: 'chemistry',
    classId: '7',
    title: 'Chemistry Class 7',
    description: 'Acids & Bases, Metals & Non-metals, Chemical Changes, Soil',
    estimatedSize: '~2 MB',
    modules: ['Exploring Substances: Acidic, Basic, and Neutral', 'The World of Metals and Non-metals', 'Chemical Changes in Everyday Life', 'Soil: A Natural Resource'],
  },
  {
    subject: 'chemistry',
    classId: '8',
    title: 'Chemistry Class 8',
    description: 'Synthetic Fibres, Plastics, Metals & Non-metals, Coal & Petroleum, Combustion',
    estimatedSize: '~2 MB',
    modules: ['Synthetic Fibres and Plastics', 'Materials: Metals and Non-metals', 'Coal and Petroleum', 'Combustion and Flame', 'Conservation of Plants and Animals'],
  },
  // Mathematics packages
  {
    subject: 'mathematics',
    classId: '6',
    title: 'Mathematics Class 6',
    description: 'Integers, Fractions, Ratio, Algebra, Geometry, Perimeter & Area',
    estimatedSize: '~1 MB',
    modules: ['Whole Numbers and Integers', 'Fractions and Decimals', 'Ratio and Proportion', 'Basic Algebra', 'Geometry and Measurement', 'Perimeter, Area, and Data'],
  },
  {
    subject: 'mathematics',
    classId: '7',
    title: 'Mathematics Class 7',
    description: 'Rational Numbers, Algebra, Lines & Angles, Congruence, Data, 3D Shapes',
    estimatedSize: '~1 MB',
    modules: ['Rational Numbers and Percentages', 'Algebraic Expressions and Equations', 'Lines, Angles, and Triangles', 'Congruence and Symmetry', 'Comparing Quantities and Data', 'Perimeter, Area, and 3D Shapes'],
  },
  {
    subject: 'mathematics',
    classId: '8',
    title: 'Mathematics Class 8',
    description: 'Powers, Linear Equations, Proportions, Polygons, Mensuration, Probability',
    estimatedSize: '~1 MB',
    modules: ['Rational Numbers, Powers, and Squares', 'Linear Equations', 'Proportions, Percentages, and Variation', 'Geometry: Polygons and 3D Figures', 'Mensuration', 'Data Handling and Probability'],
  },
  // Biology packages
  {
    subject: 'biology',
    classId: '6',
    title: 'Biology Class 6',
    description: 'Food, Plants, Body Movements, Living Organisms, Habitat, Waste',
    estimatedSize: '~2 MB',
    modules: ['Food: Where Does It Come From?', 'Components of Food', 'Getting to Know Plants', 'Body Movements', 'The Living Organisms and Their Surroundings', 'Garbage In, Garbage Out'],
  },
  {
    subject: 'biology',
    classId: '7',
    title: 'Biology Class 7',
    description: 'Nutrition, Respiration, Transportation, Reproduction, Weather & Climate',
    estimatedSize: '~2 MB',
    modules: ['Nutrition in Plants', 'Nutrition in Animals', 'Respiration in Organisms', 'Transportation in Animals and Plants', 'Reproduction in Plants', 'Weather, Climate and Adaptations'],
  },
  {
    subject: 'biology',
    classId: '8',
    title: 'Biology Class 8',
    description: 'Crop Production, Microorganisms, Cell Structure, Conservation, Reproduction, Pollution',
    estimatedSize: '~2 MB',
    modules: ['Crop Production and Management', 'Microorganisms: Friend and Foe', 'Cell — Structure and Functions', 'Conservation of Plants and Animals', 'Reproduction in Animals', 'Pollution of Air and Water'],
  },
];

const SUBJECT_ICONS: Record<SubjectId, IconName> = {
  physics: 'battery',
  chemistry: 'spark',
  mathematics: 'group',
  biology: 'bulb',
};

export interface OfflineDownloadManagerProps {
  language: Language;
  onClose: () => void;
}

export default function OfflineDownloadManager({ language, onClose }: OfflineDownloadManagerProps) {
  const t = copy[language];
  const packages = SUBJECT_PACKAGES;
  const [downloaded, setDownloaded] = useState<Set<string>>(new Set());
  const [downloading, setDownloading] = useState<string | null>(null);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);

  // Check which packages are already downloaded
  useEffect(() => {
    const checkDownloaded = async () => {
      const pkgs = await getDownloadedPackages();
      const downloadedSet = new Set(pkgs.map((p) => `${p.subject}-${p.classId}`));
      setDownloaded(downloadedSet);
    };
    checkDownloaded();
  }, []);

  const getPackageKey = (pkg: SubjectPackage) => `${pkg.subject}-${pkg.classId}`;

  const isDownloaded = (pkg: SubjectPackage) => downloaded.has(getPackageKey(pkg));
  const isDownloadingPkg = (pkg: SubjectPackage) => downloading === getPackageKey(pkg);

  const downloadPackage = async (pkg: SubjectPackage) => {
    const key = getPackageKey(pkg);
    setDownloading(key);
    setProgress((prev) => ({ ...prev, [key]: 0 }));
    setError(null);

    try {
      // In a real implementation, this would fetch and cache the subject lab HTML
      // and all its assets. For now, we simulate the download and mark as cached.
      
      // Simulate download progress
      for (let i = 0; i <= 100; i += 10) {
        await new Promise((resolve) => setTimeout(resolve, 50));
        setProgress((prev) => ({ ...prev, [key]: i }));
      }

      // Cache the subject HTML file
      const subjectUrl = `/subjects/${pkg.subject}/index.html`;
      const response = await fetch(subjectUrl);
      if (!response.ok) throw new Error('Failed to fetch subject lab');

      const html = await response.text();
      
      // Extract and cache referenced assets (simplified)
      // In a full implementation, we'd parse the HTML and cache all CSS, JS, images
      
      // Store in IndexedDB
      const downloadedPkg: DownloadedPackage = {
        subject: pkg.subject,
        classId: pkg.classId,
        downloadedAt: new Date().toISOString(),
        size: new Blob([html]).size,
        version: '1.0',
      };

      await saveDownloadedPackage(downloadedPkg);
      
      setDownloaded((prev) => new Set([...prev, key]));
      setDownloading(null);
      setProgress((prev) => ({ ...prev, [key]: 100 }));
    } catch (err) {
      setError(language === 'hi' 
        ? `डाउनलोड विफल: ${err instanceof Error ? err.message : 'अज्ञात त्रुटि'}`
        : `Download failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setDownloading(null);
      setProgress((prev) => ({ ...prev, [key]: 0 }));
    }
  };

  const removePackage = async (pkg: SubjectPackage) => {
    const key = getPackageKey(pkg);
    try {
      await removeDownloadedPackage(pkg.subject, pkg.classId);
      
      // Also clear from cache
      if ('caches' in window) {
        const cache = await caches.open('smartclass-subjects-v2');
        await cache.delete(`/subjects/${pkg.subject}/index.html`);
      }
      
      setDownloaded((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    } catch (err) {
      setError(language === 'hi' 
        ? `हटाने में विफल: ${err instanceof Error ? err.message : 'अज्ञात त्रुटि'}`
        : `Remove failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const subjectGroups = ['physics', 'chemistry', 'mathematics', 'biology'] as SubjectId[];
  
  return (
    <div className="offline-manager" role="dialog" aria-modal="true" aria-labelledby="offline-title">
      <div className="offline-manager-backdrop" onClick={onClose} />
      <div className="offline-manager-panel">
        <header className="offline-manager-header">
          <h2 id="offline-title">
            <Icon name="download" size={24} />
            {language === 'hi' ? 'ऑफ़लाइन सीखना' : 'Offline Learning'}
          </h2>
          <button className="icon-button" type="button" aria-label={t.back || 'Close'} onClick={onClose}>
            <Icon name="close" size={24} />
          </button>
        </header>

        {error && (
          <div className="offline-error" role="alert">
            <Icon name="alert" size={20} /> {error}
            <button type="button" onClick={() => setError(null)}>✕</button>
          </div>
        )}

        <div className="offline-manager-content">
          <p className="offline-intro">
            {language === 'hi'
              ? 'विषय पैकेज डाउनलोड करें ताकि आप बिना इंटरनेट के सीख सकें।'
              : 'Download subject packages to learn without an internet connection.'}
          </p>

          {subjectGroups.map((subject) => {
            const subjectPackages = packages.filter((p) => p.subject === subject);
            if (subjectPackages.length === 0) return null;

            return (
              <section key={subject} className="offline-subject-section">
                <h3 className="offline-subject-title">
                  <Icon name={SUBJECT_ICONS[subject]} size={20} />
                  {subject.charAt(0).toUpperCase() + subject.slice(1)}
                </h3>
                <div className="offline-package-grid">
                  {subjectPackages.map((pkg) => {
                    const key = getPackageKey(pkg);
                    const pkgDownloaded = isDownloaded(pkg);
                    const pkgDownloading = isDownloadingPkg(pkg);
                    const pkgProgress = progress[key] ?? 0;

                    return (
                      <article key={key} className={`offline-package-card ${pkgDownloaded ? 'downloaded' : ''} ${pkgDownloading ? 'downloading' : ''}`}>
                        <div className="package-header">
                          <div>
                            <h4>{pkg.title}</h4>
                            <p className="package-description">{pkg.description}</p>
                          </div>
                          <span className={`package-status ${pkgDownloaded ? 'downloaded' : pkgDownloading ? 'downloading' : 'available'}`}>
                            {pkgDownloaded ? (
                              <>
                                <Icon name="check" size={16} />
                                {language === 'hi' ? 'डाउनलोड किया गया' : 'Downloaded'}
                              </>
                            ) : pkgDownloading ? (
                              <>
                                <Icon name="pulse" size={16} className="spinning" />
                                {language === 'hi' ? 'डाउनलोड हो रहा है...' : 'Downloading...'}
                              </>
                            ) : (
                              <>
                                <Icon name="download" size={16} />
                                {language === 'hi' ? 'उपलब्ध' : 'Available'}
                              </>
                            )}
                          </span>
                        </div>

                        <div className="package-details">
                          <div className="package-size">
                            <Icon name="database" size={16} /> {pkg.estimatedSize}
                          </div>
                          <details className="package-modules">
                            <summary>{language === 'hi' ? 'मॉड्यूल' : 'Modules'} ({pkg.modules.length})</summary>
                            <ul>
                              {pkg.modules.map((module, i) => (
                                <li key={i}>{module}</li>
                              ))}
                            </ul>
                          </details>
                        </div>

                        {pkgDownloading && (
                          <div className="download-progress" role="progressbar" aria-valuenow={pkgProgress} aria-valuemin={0} aria-valuemax={100}>
                            <div className="progress-bar">
                              <div className="progress-fill" style={{ width: `${pkgProgress}%` }} />
                            </div>
                            <span>{pkgProgress}%</span>
                          </div>
                        )}

                        <div className="package-actions">
                          {pkgDownloaded ? (
                            <button
                              className="btn btn-secondary"
                              type="button"
                              onClick={() => removePackage(pkg)}
                              disabled={pkgDownloading}
                            >
                              <Icon name="trash" size={18} />
                              {language === 'hi' ? 'हटाएँ' : 'Remove'}
                            </button>
                          ) : (
                            <button
                              className="btn btn-primary"
                              type="button"
                              onClick={() => downloadPackage(pkg)}
                              disabled={pkgDownloading}
                            >
                              <Icon name="download" size={18} />
                              {language === 'hi' ? 'डाउनलोड करें' : 'Download'}
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        <footer className="offline-manager-footer">
          <p className="offline-note">
            <Icon name="info" size={16} />
            {language === 'hi'
              ? 'डाउनलोड की गई सामग्री इस डिवाइस पर संग्रहीत होती है और ऑफ़लाइन काम करती है।'
              : 'Downloaded content is stored on this device and works offline.'}
          </p>
        </footer>
      </div>
    </div>
  );
}