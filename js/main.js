// ===== Mobile Menu Toggle =====
(function() {
  var menuToggle = document.getElementById('menuToggle');
  var nav = document.getElementById('nav');
  if (menuToggle && nav) {
    menuToggle.addEventListener('click', function() {
      menuToggle.classList.toggle('active');
      nav.classList.toggle('show');
    });
  }

  // Close menu when clicking a nav link (mobile)
  var navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(function(link) {
    link.addEventListener('click', function() {
      if (menuToggle) menuToggle.classList.remove('active');
      if (nav) nav.classList.remove('show');
    });
  });
})();

// ===== Modal =====
(function() {
  var overlay = document.getElementById('modalOverlay');
  var closeBtn = document.getElementById('modalClose');
  if (overlay && closeBtn) {
    closeBtn.addEventListener('click', function() {
      overlay.classList.remove('show');
      document.body.style.overflow = '';
    });
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) {
        overlay.classList.remove('show');
        document.body.style.overflow = '';
      }
    });
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && overlay.classList.contains('show')) {
        overlay.classList.remove('show');
        document.body.style.overflow = '';
      }
    });
  }
})();

// ===== Appointment Form =====
(function() {
  var form = document.getElementById('appointmentForm');
  if (form) {
    var deptSelect = document.getElementById('dept');
    var doctorSelect = document.getElementById('doctor');

    // Doctor cascading data
    var doctorData = {
      '内科': ['张明远 - 主任医师 · 心内科', '刘志强 - 副主任医师 · 消化内科', '陈晓燕 - 主任医师 · 呼吸内科'],
      '外科': ['王建国 - 主任医师 · 骨科', '孙立新 - 副主任医师 · 普外科', '周文博 - 主任医师 · 神经外科'],
      '儿科': ['李慧芳 - 副主任医师 · 儿科', '马晓峰 - 主任医师 · 新生儿科'],
      '妇科': ['赵丽娟 - 主任医师', '吴秀兰 - 副主任医师'],
      '骨科': ['王建国 - 主任医师 · 脊柱外科', '孙立新 - 副主任医师 · 关节外科', '杨德才 - 主任医师 · 创伤骨科'],
      '皮肤科': ['陈敏华 - 主任医师', '林小燕 - 副主任医师 · 皮肤美容'],
      '眼科': ['黄明亮 - 主任医师 · 白内障', '钱晓峰 - 副主任医师 · 眼底病'],
      '耳鼻喉科': ['郑青山 - 主任医师', '蒋丽萍 - 副主任医师'],
      '中医科': ['赵丽娟 - 主任医师 · 中医内科', '许德厚 - 主任医师 · 针灸推拿'],
      '神经内科': ['周文博 - 主任医师 · 脑血管病', '吴志强 - 副主任医师'],
      '心血管内科': ['张明远 - 主任医师 · 冠心病', '李建国 - 副主任医师 · 心律失常']
    };

    if (deptSelect && doctorSelect) {
      deptSelect.addEventListener('change', function() {
        var dept = deptSelect.value;
        doctorSelect.innerHTML = '<option value="">请选择医生</option>';
        if (dept && doctorData[dept]) {
          doctorData[dept].forEach(function(doc) {
            var opt = document.createElement('option');
            opt.value = doc;
            opt.textContent = doc;
            doctorSelect.appendChild(opt);
          });
        }
      });
    }

    // Date picker min
    var dateInput = document.getElementById('date');
    if (dateInput) {
      dateInput.setAttribute('min', new Date().toISOString().split('T')[0]);
    }

    // Form submit
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      var name = document.getElementById('patientName') ? document.getElementById('patientName').value : '';
      var dept = deptSelect ? deptSelect.value : '';
      var doctor = doctorSelect ? doctorSelect.value : '';
      var date = dateInput ? dateInput.value : '';
      var timeSlot = document.getElementById('timeSlot') ? document.getElementById('timeSlot').value : '';
      var overlay = document.getElementById('modalOverlay');
      var modalMsg = document.getElementById('modalMsg');
      if (overlay && modalMsg) {
        modalMsg.textContent = name + '，您已成功预约 ' + dept + ' - ' + doctor + '，就诊时间为 ' + date + ' ' + timeSlot + '。请留意短信通知。';
        overlay.classList.add('show');
        document.body.style.overflow = 'hidden';
      }
    });
  }
})();

// ===== Contact Form =====
(function() {
  var form = document.getElementById('contactForm');
  if (form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      var overlay = document.getElementById('modalOverlay');
      var modalMsg = document.getElementById('modalMsg');
      if (overlay && modalMsg) {
        modalMsg.textContent = '留言已提交成功，我们的客服会在24小时内与您联系，感谢您的反馈！';
        overlay.classList.add('show');
        document.body.style.overflow = 'hidden';
        form.reset();
      }
    });
  }
})();

// ===== Tab Switching =====
(function() {
  var tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      var tabGroup = btn.parentElement;
      // Deactivate all tabs in this group
      tabGroup.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');

      // Find the target content
      var targetId = btn.getAttribute('data-tab');
      // Look for tab-content in the nearest container
      var container = tabGroup.parentElement;
      while (container && !container.querySelector('.tab-content')) {
        container = container.parentElement;
      }
      if (container) {
        container.querySelectorAll('.tab-content').forEach(function(tc) { tc.classList.remove('active'); });
        var target = document.getElementById(targetId);
        if (target) target.classList.add('active');
      }
    });
  });
})();

// ===== FAQ Accordion =====
(function() {
  document.querySelectorAll('.faq-q').forEach(function(q) {
    q.addEventListener('click', function() {
      var faqItem = this.parentElement;
      var faqA = faqItem.querySelector('.faq-a');
      if (faqA) {
        var isOpen = faqA.classList.contains('show');
        // Close all in same list
        var list = faqItem.parentElement;
        list.querySelectorAll('.faq-a').forEach(function(a) { a.classList.remove('show'); });
        list.querySelectorAll('.faq-q').forEach(function(h) { h.classList.remove('open'); });
        if (!isOpen) {
          faqA.classList.add('show');
          q.classList.add('open');
        }
      }
    });
  });
})();

// ===== Accordion (generic, for disease detail etc.) =====
(function() {
  document.querySelectorAll('.accordion-header').forEach(function(header) {
    header.addEventListener('click', function() {
      this.classList.toggle('open');
      var body = this.nextElementSibling;
      if (body && body.classList.contains('accordion-body')) {
        body.classList.toggle('show');
      }
    });
  });
})();

console.log('大冲村诊所-健康医疗 - 多页面网站已就绪');
