document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('quizForm');
    const resultDiv = document.getElementById('quizResult');
  
    if (form) {
      form.addEventListener('submit', function (event) {
        event.preventDefault();
  
        const lifestyle = document.querySelector('input[name="lifestyle"]:checked');
        const workStyle = document.querySelector('input[name="workStyle"]:checked');
        const environment = document.querySelector('input[name="environment"]:checked');
        const tech = document.querySelector('input[name="tech"]:checked');
  
        if (!lifestyle || !workStyle || !environment || !tech) {
          resultDiv.innerText = "⚠️ Please answer all questions before submitting.";
          return;
        }
  
        const lifestyleVal = lifestyle.value;
        const workStyleVal = workStyle.value;
        const environmentVal = environment.value;
        const techVal = tech.value;
  
        let jobType = '';
        let categories = [];
  
        if (lifestyleVal === 'remote' && techVal === 'love') {
          jobType = "Remote";
          categories = ["Tech & IT", "Business & Finance", "Creative & Design"];
        } else if (lifestyleVal === 'hybrid' && workStyleVal === 'organizing') {
          jobType = "Hybrid";
          categories = ["Admin & Clerical", "HR", "Business & Finance"];
        } else if (lifestyleVal === 'onsite' && workStyleVal === 'helping') {
          jobType = "On-site";
          categories = ["Customer Service", "Healthcare", "Education"];
        } else if (workStyleVal === 'creative' && environmentVal === 'variety') {
          jobType = "Remote";
          categories = ["Creative & Design", "Marketing", "Sales"];
        } else if (workStyleVal === 'problemsolving' && techVal !== 'avoid') {
          jobType = lifestyleVal === 'onsite' ? "On-site" : "Hybrid";
          categories = ["Engineering & Architecture", "Tech & IT", "Business & Finance"];
        } else if (techVal === 'ok' && workStyleVal === 'organizing') {
          jobType = "Hybrid";
          categories = ["Business & Finance", "Admin & Clerical", "HR"];
        } else if (workStyleVal === 'helping' && techVal === 'avoid') {
          jobType = "On-site";
          categories = ["Education", "Healthcare", "Customer Service"];
        } else {
          // Fallback based on lifestyle
          jobType = lifestyleVal === 'remote' ? "Remote"
                    : lifestyleVal === 'hybrid' ? "Hybrid"
                    : "On-site";
          categories = ["Sales & Marketing", "Customer Service", "Creative & Design"];
        }
  
        resultDiv.innerHTML = `
        <h3>🎯 Your Ideal Job Type: <span>${jobType}</span></h3>
        <p>Top 3 Career Categories for You:</p>
        <ul>${categories.map(c => `<li>${c}</li>`).join('')}</ul>
        <div class="quiz-link">
          <h3>🚀 Ready to explore internships? Use these filters to find your dream job!</h3>
          <a href="dashboard.html" id="opportunitiesLink"> Internship Opportunities</a>
        </div>
      `;
      
      // Optionally load additional script for the dashboard page
      const script = document.createElement('script');
      script.src = 'assets/js/script.js';
      document.body.appendChild(script);
      
      });
    }
  });
  