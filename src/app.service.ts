import { Injectable } from '@nestjs/common';
import * as os from 'os';

@Injectable()
export class AppService {
  getHelloHtml(): string {
    return `
      <html>
        <head>
          <title>MiGestor - Gestiona tu negocio de manera inteligente</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            html {
              scroll-behavior: smooth;
            }
            
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
              line-height: 1.6;
              color: #000000;
              overflow-x: hidden;
            }
            
            .container {
              max-width: 1200px;
              margin: 0 auto;
              padding: 0 20px;
            }
            
            /* Header */
            header {
              background: linear-gradient(135deg, #00a651 0%, #0BE700 100%);
              color: white;
              padding: 1rem 0;
              position: fixed;
              width: 100%;
              top: 0;
              z-index: 1000;
              backdrop-filter: blur(10px);
              box-shadow: 0 2px 20px rgba(0, 166, 81, 0.3);
            }
            
            nav {
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            
            .logo {
              display: flex;
              align-items: center;
              text-decoration: none;
              transition: transform 0.3s ease;
            }
            
            .logo:hover {
              transform: scale(1.05);
            }
            
            .logo-svg {
              width: 50px;
              height: 50px;
              margin-right: 10px;
            }
            
            .nav-links {
              display: flex;
              list-style: none;
              gap: 2rem;
            }
            
            .nav-links a {
              color: white;
              text-decoration: none;
              transition: all 0.3s ease;
              padding: 8px 16px;
              border-radius: 25px;
              position: relative;
              overflow: hidden;
            }
            
            .nav-links a::before {
              content: '';
              position: absolute;
              top: 0;
              left: -100%;
              width: 100%;
              height: 100%;
              background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
              transition: left 0.5s;
            }
            
            .nav-links a:hover::before {
              left: 100%;
            }
            
            .nav-links a:hover {
              background: rgba(255, 255, 255, 0.1);
              transform: translateY(-2px);
            }
            
            /* Back to top button */
            .back-to-top {
              position: fixed;
              bottom: 30px;
              right: 30px;
              background: linear-gradient(45deg, #00a651, #0BE700);
              color: white;
              width: 50px;
              height: 50px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              text-decoration: none;
              font-size: 1.5rem;
              box-shadow: 0 4px 15px rgba(0, 166, 81, 0.4);
              transition: all 0.3s ease;
              opacity: 0;
              visibility: hidden;
              z-index: 1000;
            }
            
            .back-to-top.visible {
              opacity: 1;
              visibility: visible;
            }
            
            .back-to-top:hover {
              transform: translateY(-3px) scale(1.1);
              box-shadow: 0 6px 25px rgba(0, 166, 81, 0.6);
            }
            
            /* Hero Section */
            .hero {
              background: linear-gradient(135deg, #000000 0%, #333333 50%, #00a651 100%);
              color: white;
              padding: 120px 0 80px;
              text-align: center;
              position: relative;
              overflow: hidden;
            }
            
            .hero::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000"><circle cx="200" cy="200" r="3" fill="%2300a65120"/><circle cx="800" cy="300" r="2" fill="%230BE70030"/><circle cx="400" cy="600" r="2" fill="%2300a65120"/><circle cx="700" cy="800" r="3" fill="%230BE70025"/></svg>');
              animation: float 20s infinite linear;
            }
            
            .hero::after {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: radial-gradient(circle at 30% 70%, rgba(0, 166, 81, 0.1) 0%, transparent 50%),
                          radial-gradient(circle at 70% 30%, rgba(11, 231, 0, 0.1) 0%, transparent 50%);
              animation: pulse 4s ease-in-out infinite alternate;
            }
            
            @keyframes float {
              0% { transform: translateY(0px) rotate(0deg); }
              100% { transform: translateY(-20px) rotate(360deg); }
            }
            
            @keyframes pulse {
              0% { opacity: 0.3; }
              100% { opacity: 0.7; }
            }
            
            .hero-content {
              position: relative;
              z-index: 2;
            }
            
            .hero h1 {
              font-size: 3.5rem;
              margin-bottom: 1rem;
              text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
              animation: slideInUp 1s ease-out;
            }
            
            @keyframes slideInUp {
              from {
                opacity: 0;
                transform: translateY(30px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            
            .hero p {
              font-size: 1.3rem;
              margin-bottom: 2rem;
              opacity: 0.95;
              animation: slideInUp 1s ease-out 0.2s both;
            }
            
            .cta-button {
              display: inline-block;
              background: linear-gradient(45deg, #00a651, #0BE700);
              color: white;
              padding: 15px 40px;
              text-decoration: none;
              border-radius: 50px;
              font-weight: bold;
              font-size: 1.1rem;
              transition: all 0.3s ease;
              box-shadow: 0 4px 15px rgba(0, 166, 81, 0.4);
              animation: slideInUp 1s ease-out 0.4s both;
              position: relative;
              overflow: hidden;
            }
            
            .cta-button::before {
              content: '';
              position: absolute;
              top: 0;
              left: -100%;
              width: 100%;
              height: 100%;
              background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
              transition: left 0.5s;
            }
            
            .cta-button:hover::before {
              left: 100%;
            }
            
            .cta-button:hover {
              transform: translateY(-2px) scale(1.05);
              box-shadow: 0 6px 20px rgba(0, 166, 81, 0.6);
            }
            
            /* Features Section */
            .features {
              padding: 80px 0;
              background: linear-gradient(135deg, #f8f9fa 0%, #e8f5e8 100%);
              position: relative;
            }
            
            .features::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="20" cy="30" r="1" fill="%2300a65110"/><circle cx="70" cy="20" r="0.5" fill="%230BE70015"/><circle cx="50" cy="80" r="0.8" fill="%2300a65108"/></svg>');
              opacity: 0.5;
            }
            
            .section-title {
              text-align: center;
              font-size: 2.5rem;
              color: #000000;
              margin-bottom: 3rem;
              position: relative;
              z-index: 2;
            }
            
            .section-title::after {
              content: '';
              position: absolute;
              bottom: -10px;
              left: 50%;
              transform: translateX(-50%);
              width: 80px;
              height: 4px;
              background: linear-gradient(90deg, #00a651, #0BE700);
              border-radius: 2px;
            }
            
            .features-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
              gap: 2rem;
              margin-top: 2rem;
              position: relative;
              z-index: 2;
            }
            
            .feature-card {
              background: white;
              padding: 2rem;
              border-radius: 20px;
              text-align: center;
              box-shadow: 0 10px 30px rgba(0, 166, 81, 0.1);
              transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
              border-top: 4px solid #00a651;
              position: relative;
              overflow: hidden;
            }
            
            .feature-card::before {
              content: '';
              position: absolute;
              top: 0;
              left: -100%;
              width: 100%;
              height: 100%;
              background: linear-gradient(90deg, transparent, rgba(0, 166, 81, 0.05), transparent);
              transition: left 0.6s ease;
            }
            
            .feature-card:hover::before {
              left: 100%;
            }
            
            .feature-card:nth-child(2) {
              border-top-color: #0BE700;
            }
            
            .feature-card:nth-child(3) {
              border-top-color: #006633;
            }
            
            .feature-card:hover {
              transform: translateY(-8px) rotate(1deg);
              box-shadow: 0 20px 40px rgba(0, 166, 81, 0.2);
            }
            
            .feature-icon {
              width: 70px;
              height: 70px;
              background: linear-gradient(45deg, #00a651, #0BE700);
              border-radius: 50%;
              margin: 0 auto 1rem;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 1.8rem;
              color: white;
              transition: all 0.3s ease;
              box-shadow: 0 5px 15px rgba(0, 166, 81, 0.3);
            }
            
            .feature-card:hover .feature-icon {
              transform: scale(1.1) rotate(10deg);
              box-shadow: 0 8px 25px rgba(0, 166, 81, 0.4);
            }
            
            .feature-card h3 {
              font-size: 1.5rem;
              color: #000000;
              margin-bottom: 1rem;
              transition: color 0.3s ease;
            }
            
            .feature-card:hover h3 {
              color: #00a651;
            }
            
            .feature-card p {
              color: #333333;
              line-height: 1.6;
              transition: color 0.3s ease;
            }
            
            .feature-card:hover p {
              color: #000000;
            }
            
            /* Stats Section */
            .stats {
              background: linear-gradient(135deg, #000000 0%, #333333 50%, #00a651 100%);
              color: white;
              padding: 80px 0;
              text-align: center;
              position: relative;
              overflow: hidden;
            }
            
            .stats::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: radial-gradient(circle at 20% 80%, rgba(0, 166, 81, 0.2) 0%, transparent 50%),
                          radial-gradient(circle at 80% 20%, rgba(11, 231, 0, 0.1) 0%, transparent 50%);
              animation: rotate 15s linear infinite;
            }
            
            @keyframes rotate {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            
            .stats-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 3rem;
              position: relative;
              z-index: 2;
            }
            
            .stat-item {
              transition: all 0.3s ease;
              padding: 1rem;
              border-radius: 15px;
              position: relative;
              overflow: hidden;
            }
            
            .stat-item::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: rgba(0, 166, 81, 0.1);
              transform: scaleX(0);
              transition: transform 0.3s ease;
              transform-origin: left;
            }
            
            .stat-item:hover::before {
              transform: scaleX(1);
            }
            
            .stat-item:hover {
              transform: translateY(-5px) scale(1.05);
            }
            
            .stat-item h3 {
              font-size: 3.5rem;
              color: #0BE700;
              margin-bottom: 0.5rem;
              position: relative;
              z-index: 2;
              text-shadow: 0 0 20px rgba(11, 231, 0, 0.5);
              transition: all 0.3s ease;
            }
            
            .stat-item:hover h3 {
              transform: scale(1.1);
              text-shadow: 0 0 30px rgba(11, 231, 0, 0.8);
            }
            
            .stat-item p {
              font-size: 1.1rem;
              opacity: 0.9;
              position: relative;
              z-index: 2;
              transition: opacity 0.3s ease;
            }
            
            .stat-item:hover p {
              opacity: 1;
            }
            
            /* CTA Section */
            .cta-section {
              background: linear-gradient(135deg, #000000 0%, #00a651 50%, #0BE700 100%);
              color: white;
              padding: 100px 0;
              text-align: center;
              position: relative;
              overflow: hidden;
            }
            
            .cta-section::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><circle cx="50" cy="50" r="2" fill="%23ffffff15"/><circle cx="150" cy="100" r="1.5" fill="%23ffffff20"/><circle cx="100" cy="150" r="1" fill="%23ffffff15"/></svg>');
              animation: float 25s infinite linear reverse;
            }
            
            .cta-section h2 {
              font-size: 2.8rem;
              margin-bottom: 1rem;
              position: relative;
              z-index: 2;
              text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            }
            
            .cta-section p {
              font-size: 1.3rem;
              margin-bottom: 2.5rem;
              opacity: 0.95;
              position: relative;
              z-index: 2;
            }
            
            /* Footer */
            footer {
              background: linear-gradient(135deg, #000000 0%, #333333 100%);
              color: white;
              padding: 60px 0 30px;
              text-align: center;
              position: relative;
            }
            
            .footer-content {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
              gap: 3rem;
              margin-bottom: 3rem;
            }
            
            .footer-section {
              transition: transform 0.3s ease;
            }
            
            .footer-section:hover {
              transform: translateY(-5px);
            }
            
            .footer-section h4 {
              color: #0BE700;
              margin-bottom: 1.5rem;
              font-size: 1.2rem;
              position: relative;
            }
            
            .footer-section h4::after {
              content: '';
              position: absolute;
              bottom: -5px;
              left: 0;
              width: 30px;
              height: 2px;
              background: linear-gradient(90deg, #00a651, #0BE700);
            }
            
            .footer-section a {
              color: #999999;
              text-decoration: none;
              display: block;
              margin-bottom: 0.8rem;
              transition: all 0.3s ease;
              padding: 5px 0;
              position: relative;
            }
            
            .footer-section a::before {
              content: '';
              position: absolute;
              left: 0;
              bottom: 0;
              width: 0;
              height: 1px;
              background: #0BE700;
              transition: width 0.3s ease;
            }
            
            .footer-section a:hover::before {
              width: 100%;
            }
            
            .footer-section a:hover {
              color: #0BE700;
              transform: translateX(5px);
            }
            
            .footer-bottom {
              border-top: 1px solid #444444;
              padding-top: 30px;
              color: #999999;
            }
            
            /* Responsive */
            @media (max-width: 768px) {
              .nav-links {
                display: none;
              }
              
              .hero h1 {
                font-size: 2.5rem;
              }
              
              .hero p {
                font-size: 1.1rem;
              }
              
              .features-grid {
                grid-template-columns: 1fr;
              }
              
              .stats-grid {
                grid-template-columns: repeat(2, 1fr);
              }
            }
            
            @media (max-width: 480px) {
              .hero h1 {
                font-size: 2rem;
              }
              
              .section-title {
                font-size: 2rem;
              }
              
              .stats-grid {
                grid-template-columns: 1fr;
              }
            }
          </style>
        </head>
        <body>
          <header>
            <nav class="container">
              <a href="#" class="logo">MiGestor</a>
              <ul class="nav-links">
                <li><a href="#inicio">Inicio</a></li>
                <li><a href="#funciones">Funciones</a></li>
                <li><a href="#precios">Precios</a></li>
                <li><a href="#contacto">Contacto</a></li>
              </ul>
            </nav>
          </header>
          
          <section class="hero" id="inicio">
            <div class="container">
              <div class="hero-content">
                <h1>MiGestor</h1>
                <p>La solución integral para gestionar tu negocio de manera inteligente y eficiente</p>
                <a href="#" class="cta-button">Comenzar Gratis</a>
              </div>
            </div>
          </section>
          
          <section class="features" id="funciones">
            <div class="container">
              <h2 class="section-title">¿Por qué elegir MiGestor?</h2>
              <div class="features-grid">
                <div class="feature-card">
                  <div class="feature-icon">📊</div>
                  <h3>Gestión Inteligente</h3>
                  <p>Automatiza tus procesos empresariales con algoritmos inteligentes que se adaptan a tu negocio y optimizan tus operaciones diarias.</p>
                </div>
                <div class="feature-card">
                  <div class="feature-icon">📈</div>
                  <h3>Analytics Avanzados</h3>
                  <p>Obtén insights valiosos con dashboards interactivos y reportes detallados que te ayudan a tomar decisiones basadas en datos.</p>
                </div>
                <div class="feature-card">
                  <div class="feature-icon">🔒</div>
                  <h3>Seguridad Total</h3>
                  <p>Protege tu información con encriptación de nivel empresarial y cumplimiento de estándares internacionales de seguridad.</p>
                </div>
              </div>
            </div>
          </section>
          
          <section class="stats">
            <div class="container">
              <div class="stats-grid">
                <div class="stat-item">
                  <h3>10K+</h3>
                  <p>Empresas Activas</p>
                </div>
                <div class="stat-item">
                  <h3>99.9%</h3>
                  <p>Uptime Garantizado</p>
                </div>
                <div class="stat-item">
                  <h3>50+</h3>
                  <p>Países Atendidos</p>
                </div>
                <div class="stat-item">
                  <h3>24/7</h3>
                  <p>Soporte Técnico</p>
                </div>
              </div>
            </div>
          </section>
          
          <section class="cta-section">
            <div class="container">
              <h2>¿Listo para transformar tu negocio?</h2>
              <p>Únete a miles de empresas que ya confían en MiGestor para gestionar sus operaciones</p>
              <a href="#" class="cta-button">Prueba Gratuita de 30 Días</a>
            </div>
          </section>
          
          <footer>
            <div class="container">
              <div class="footer-content">
                <div class="footer-section">
                  <h4>Producto</h4>
                  <a href="#">Funciones</a>
                  <a href="#">Precios</a>
                  <a href="#">Demo</a>
                  <a href="#">API</a>
                </div>
                <div class="footer-section">
                  <h4>Empresa</h4>
                  <a href="#">Acerca de</a>
                  <a href="#">Blog</a>
                  <a href="#">Careers</a>
                  <a href="#">Prensa</a>
                </div>
                <div class="footer-section">
                  <h4>Soporte</h4>
                  <a href="#">Centro de Ayuda</a>
                  <a href="#">Contacto</a>
                  <a href="#">Estado del Sistema</a>
                  <a href="#">Documentación</a>
                </div>
                <div class="footer-section">
                  <h4>Legal</h4>
                  <a href="#">Privacidad</a>
                  <a href="#">Términos</a>
                  <a href="#">Cookies</a>
                  <a href="#">Seguridad</a>
                </div>
              </div>
              <div class="footer-bottom">
                <p>&copy; 2025 MiGestor. Todos los derechos reservados.</p>
              </div>
            </div>
          </footer>
        </body>
      </html>
    `;
  }

  private formatDate(date: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} - ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  }

  private formatUptime(seconds: number): string {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }

  getServerHealth() {
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    const loadAvg = os.loadavg();

    return {
      status: 'ok',
      message: 'Servidor en funcionamiento',
      timestamp: this.formatDate(new Date()),
      uptime: this.formatUptime(uptime),
      memory: {
        rssMB: (memoryUsage.rss / 1024 / 1024).toFixed(2),
        heapUsedMB: (memoryUsage.heapUsed / 1024 / 1024).toFixed(2),
        heapTotalMB: (memoryUsage.heapTotal / 1024 / 1024).toFixed(2),
      },
      system: {
        platform: os.platform(),
        architecture: os.arch(),
        loadAverage: loadAvg.map((v) => v.toFixed(2)),
        freeMemoryMB: (os.freemem() / 1024 / 1024).toFixed(2),
        totalMemoryMB: (os.totalmem() / 1024 / 1024).toFixed(2),
      },
    };
  }
}