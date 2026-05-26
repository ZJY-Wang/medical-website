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
  var navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(function(link) {
    link.addEventListener('click', function() {
      if (menuToggle) menuToggle.classList.remove('active');
      if (nav) nav.classList.remove('show');
    });
  });
})();

// ===== Accessibility Toolbar =====
(function() {
  var toolbar = document.querySelector('.a11y-toolbar');
  if (!toolbar) return;

  var fontSizeBtn = toolbar.querySelector('[data-a11y="font-size"]');
  var contrastBtn = toolbar.querySelector('[data-a11y="contrast"]');

  if (fontSizeBtn) {
    fontSizeBtn.addEventListener('click', function() {
      document.body.classList.toggle('a11y-large-font');
      this.classList.toggle('toggled');
      localStorage.setItem('a11y-large-font', document.body.classList.contains('a11y-large-font'));
      showToast(document.body.classList.contains('a11y-large-font') ? '大字体模式已开启' : '大字体模式已关闭', 'info');
    });
    // Restore preference
    if (localStorage.getItem('a11y-large-font') === 'true') {
      document.body.classList.add('a11y-large-font');
      fontSizeBtn.classList.add('toggled');
    }
  }

  if (contrastBtn) {
    contrastBtn.addEventListener('click', function() {
      document.body.classList.toggle('a11y-high-contrast');
      this.classList.toggle('toggled');
      localStorage.setItem('a11y-high-contrast', document.body.classList.contains('a11y-high-contrast'));
      showToast(document.body.classList.contains('a11y-high-contrast') ? '高对比度模式已开启' : '高对比度模式已关闭', 'info');
    });
    if (localStorage.getItem('a11y-high-contrast') === 'true') {
      document.body.classList.add('a11y-high-contrast');
      contrastBtn.classList.add('toggled');
    }
  }
})();

// ===== Auth Simulation =====
(function() {
  // Simulate login state with localStorage
  window.AppAuth = {
    isLoggedIn: function() {
      return !!localStorage.getItem('med_user');
    },
    getUser: function() {
      var u = localStorage.getItem('med_user');
      return u ? JSON.parse(u) : null;
    },
    login: function(role, name) {
      var user = { role: role, name: name, loggedAt: new Date().toISOString() };
      localStorage.setItem('med_user', JSON.stringify(user));
      return user;
    },
    logout: function() {
      localStorage.removeItem('med_user');
    },
    getRole: function() {
      var u = this.getUser();
      return u ? u.role : null;
    }
  };

  // Login form handler
  var loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
      e.preventDefault();
      var username = document.getElementById('loginUsername');
      var password = document.getElementById('loginPassword');
      var errorEl = document.getElementById('loginError');
      var roleTabs = document.querySelectorAll('.auth-role-tab');
      var activeRole = 'patient';
      roleTabs.forEach(function(t) {
        if (t.classList.contains('active')) activeRole = t.getAttribute('data-role');
      });

      if (!username.value || !password.value) {
        if (errorEl) { errorEl.textContent = '请填写用户名和密码'; errorEl.classList.add('show'); }
        return;
      }
      if (password.value.length < 3) {
        if (errorEl) { errorEl.textContent = '密码长度不能少于3位'; errorEl.classList.add('show'); }
        return;
      }

      var roleNames = { patient: '患者', doctor: '医生', admin: '管理员' };
      var displayName = username.value + '(' + roleNames[activeRole] + ')';
      AppAuth.login(activeRole, displayName);

      showToast('登录成功，欢迎回来！', 'success');

      // Redirect based on role
      setTimeout(function() {
        var redirects = {
          patient: 'patient-dashboard.html',
          doctor: 'doctor-workstation.html',
          admin: 'admin-panel.html'
        };
        window.location.href = redirects[activeRole] || 'index.html';
      }, 800);
    });
  }

  // Role tabs
  var roleTabs = document.querySelectorAll('.auth-role-tab');
  roleTabs.forEach(function(tab) {
    tab.addEventListener('click', function() {
      roleTabs.forEach(function(t) { t.classList.remove('active'); });
      tab.classList.add('active');
    });
  });

  // Register form handler
  var registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', function(e) {
      e.preventDefault();
      var username = document.getElementById('regUsername');
      var password = document.getElementById('regPassword');
      var confirm = document.getElementById('regConfirm');
      var errorEl = document.getElementById('regError');

      if (!username.value || !password.value) {
        if (errorEl) { errorEl.textContent = '请填写用户名和密码'; errorEl.classList.add('show'); }
        return;
      }
      if (password.value !== confirm.value) {
        if (errorEl) { errorEl.textContent = '两次密码不一致'; errorEl.classList.add('show'); }
        return;
      }
      if (password.value.length < 3) {
        if (errorEl) { errorEl.textContent = '密码长度不能少于3位'; errorEl.classList.add('show'); }
        return;
      }

      showToast('注册成功！即将跳转到登录页面...', 'success');
      setTimeout(function() {
        window.location.href = 'login.html';
      }, 1000);
    });
  }

  // Update nav based on auth state
  function updateNavAuth() {
    var loginLinks = document.querySelectorAll('.nav-login, .nav-register');
    var userLinks = document.querySelectorAll('.nav-user-area');
    if (AppAuth.isLoggedIn()) {
      var user = AppAuth.getUser();
      loginLinks.forEach(function(l) { l.style.display = 'none'; });
      userLinks.forEach(function(l) { l.style.display = 'flex'; });
      var userNameSpan = document.querySelector('.nav-user-name');
      if (userNameSpan) userNameSpan.textContent = user.name;
      // Update dashboard link
      var dashLink = document.querySelector('.nav-user-dashboard');
      if (dashLink) {
        var dashUrls = { patient: 'patient-dashboard.html', doctor: 'doctor-workstation.html', admin: 'admin-panel.html' };
        dashLink.href = dashUrls[user.role] || 'patient-dashboard.html';
      }
    } else {
      loginLinks.forEach(function(l) { l.style.display = ''; });
      userLinks.forEach(function(l) { l.style.display = 'none'; });
    }
  }
  updateNavAuth();
  window.updateNavAuth = updateNavAuth;
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

    var dateInput = document.getElementById('date');
    if (dateInput) {
      dateInput.setAttribute('min', new Date().toISOString().split('T')[0]);
    }

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

        // Save to localStorage for dashboard
        var appointments = JSON.parse(localStorage.getItem('med_appointments') || '[]');
        appointments.push({
          id: Date.now(),
          patientName: name,
          dept: dept,
          doctor: doctor,
          date: date,
          timeSlot: timeSlot,
          status: '已预约',
          createdAt: new Date().toISOString()
        });
        localStorage.setItem('med_appointments', JSON.stringify(appointments));
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
      tabGroup.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');

      var targetId = btn.getAttribute('data-tab');
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

// ===== Accordion (generic) =====
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

// ===== Voice Input =====
(function() {
  var voiceBtns = document.querySelectorAll('.voice-btn');
  voiceBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      var targetId = btn.getAttribute('data-target');
      var inputEl = document.getElementById(targetId);
      if (!inputEl) return;

      var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        showToast('您的浏览器不支持语音输入功能', 'error');
        return;
      }

      if (btn.classList.contains('listening')) {
        btn.classList.remove('listening');
        showToast('语音输入已停止', 'info');
        return;
      }

      var recognition = new SpeechRecognition();
      recognition.lang = 'zh-CN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      btn.classList.add('listening');
      var voiceStatus = document.getElementById('voiceStatus');
      if (voiceStatus) voiceStatus.classList.add('show');

      recognition.start();

      recognition.onresult = function(event) {
        var transcript = event.results[0][0].transcript;
        inputEl.value = transcript;
        showToast('语音识别成功：' + transcript, 'success');
      };

      recognition.onerror = function(event) {
        showToast('语音识别失败：' + event.error, 'error');
      };

      recognition.onend = function() {
        btn.classList.remove('listening');
        var voiceStatus = document.getElementById('voiceStatus');
        if (voiceStatus) voiceStatus.classList.remove('show');
      };
    });
  });
})();

// ===== AI Symptom Checker =====
(function() {
  var aiCheckBtn = document.getElementById('aiCheckBtn');
  var aiSymptomInput = document.getElementById('aiSymptomInput');
  var aiResult = document.getElementById('aiResult');

  if (aiCheckBtn && aiSymptomInput && aiResult) {
    aiCheckBtn.addEventListener('click', function() {
      var symptom = aiSymptomInput.value.trim();
      if (!symptom) { showToast('请先描述您的症状', 'error'); return; }

      aiResult.innerHTML = '<p style="color:var(--text-muted);">AI正在分析中...</p>';
      aiResult.classList.add('show');

      // Simulate AI analysis
      setTimeout(function() {
        var suggestions = analyzeSymptoms(symptom);
        aiResult.innerHTML = '<h5>AI分诊建议</h5><p><strong>推荐科室：</strong>' + suggestions.dept +
          '</p><p><strong>可能相关：</strong>' + suggestions.related +
          '</p><p><strong>建议：</strong>' + suggestions.advice +
          '</p><p style="font-size:12px;color:var(--text-muted);margin-top:8px;">⚠ 本建议仅供参考，不能替代专业医疗诊断。如有不适请及时就医。</p>';
      }, 1500);
    });
  }

  function analyzeSymptoms(symptom) {
    var s = symptom.toLowerCase();
    if (s.indexOf('头') >= 0 && (s.indexOf('晕') >= 0 || s.indexOf('痛') >= 0)) {
      return { dept: '神经内科', related: '偏头痛、颈椎病、高血压', advice: '建议测量血压，如持续头痛头晕请及时就诊神经内科。' };
    } else if (s.indexOf('胸') >= 0 && (s.indexOf('闷') >= 0 || s.indexOf('痛') >= 0)) {
      return { dept: '心内科', related: '冠心病、心绞痛、心肌炎', advice: '胸痛胸闷需高度重视，建议尽快就诊心内科，必要时立即拨打120。' };
    } else if (s.indexOf('咳嗽') >= 0 || s.indexOf('发烧') >= 0 || s.indexOf('流涕') >= 0) {
      return { dept: '呼吸内科/全科', related: '感冒、流感、支气管炎', advice: '多休息多喝水，体温超过38.5℃可服用退热药，持续不缓解请就医。' };
    } else if (s.indexOf('肚子') >= 0 || s.indexOf('胃') >= 0 || s.indexOf('腹') >= 0) {
      return { dept: '消化内科', related: '胃炎、肠炎、消化不良', advice: '注意饮食清淡，避免辛辣刺激食物，症状持续请就诊消化内科。' };
    } else if (s.indexOf('皮肤') >= 0 || s.indexOf('痒') >= 0 || s.indexOf('疹') >= 0) {
      return { dept: '皮肤科', related: '湿疹、皮炎、过敏', advice: '避免抓挠，暂不用刺激性护肤品，建议就诊皮肤科。' };
    } else if (s.indexOf('腰') >= 0 || s.indexOf('腿') >= 0 || s.indexOf('关节') >= 0) {
      return { dept: '骨科', related: '腰椎病、关节炎、肌肉劳损', advice: '避免剧烈运动，可先进行理疗缓解，持续疼痛请就诊骨科。' };
    } else {
      return { dept: '全科/内科（建议进一步检查）', related: '症状较宽泛，需结合更多信息判断', advice: '建议前往全科门诊进行初步检查，医生会根据具体情况给出进一步建议。' };
    }
  }
})();

// ===== Payment Method Selection =====
(function() {
  var paymentMethods = document.querySelectorAll('.payment-method');
  paymentMethods.forEach(function(m) {
    m.addEventListener('click', function() {
      paymentMethods.forEach(function(pm) { pm.classList.remove('selected'); });
      this.classList.add('selected');
    });
  });
})();

// ===== Toast Notification =====
function showToast(message, type) {
  type = type || 'info';
  var toast = document.createElement('div');
  toast.className = 'toast ' + type;
  var icons = { success: '✓', error: '✕', info: 'ℹ' };
  toast.innerHTML = '<span style="font-size:18px;">' + (icons[type] || 'ℹ') + '</span><span>' + message + '</span>';
  document.body.appendChild(toast);
  setTimeout(function() {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(function() { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 300);
  }, 3000);
}

// ===== Logout Handler =====
(function() {
  var logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function(e) {
      e.preventDefault();
      if (window.AppAuth) AppAuth.logout();
      showToast('已退出登录', 'info');
      setTimeout(function() { window.location.href = 'index.html'; }, 500);
    });
  }
})();

// ===== Doctor Workstation - Patient selection =====
(function() {
  var patientItems = document.querySelectorAll('.patient-list-item');
  patientItems.forEach(function(item) {
    item.addEventListener('click', function() {
      patientItems.forEach(function(i) { i.classList.remove('selected'); });
      this.classList.add('selected');

      var name = this.getAttribute('data-name') || '';
      var age = this.getAttribute('data-age') || '';
      var gender = this.getAttribute('data-gender') || '';

      var patientNameEl = document.getElementById('selectedPatientName');
      var patientInfoEl = document.getElementById('selectedPatientInfo');
      if (patientNameEl) patientNameEl.textContent = name;
      if (patientInfoEl) patientInfoEl.textContent = gender + ' | ' + age + '岁';
    });
  });

  // AI assist for medical record
  var aiAssistBtn = document.getElementById('aiAssistBtn');
  var recordTextarea = document.getElementById('recordText');
  if (aiAssistBtn && recordTextarea) {
    aiAssistBtn.addEventListener('click', function() {
      var currentText = recordTextarea.value;
      if (!currentText.trim()) {
        showToast('请先输入基本病历信息', 'error');
        return;
      }
      aiAssistBtn.textContent = 'AI生成中...';
      setTimeout(function() {
        var enhanced = currentText + '\n\n【AI辅助建议】\n初步诊断：需结合进一步检查结果确认。\n建议检查：血常规、心电图、胸片。\n治疗建议：对症治疗，建议定期随访。\n注意事项：注意休息，避免劳累，如有不适随时复诊。';
        recordTextarea.value = enhanced;
        aiAssistBtn.textContent = '🤖 AI辅助诊断';
        showToast('AI辅助建议已生成', 'success');
      }, 1500);
    });
  }

  // Voice input for medical record
  var voiceRecordBtn = document.getElementById('voiceRecordBtn');
  if (voiceRecordBtn && recordTextarea) {
    voiceRecordBtn.addEventListener('click', function() {
      var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) { showToast('浏览器不支持语音输入', 'error'); return; }
      if (voiceRecordBtn.classList.contains('listening')) {
        voiceRecordBtn.classList.remove('listening');
        return;
      }
      var recognition = new SpeechRecognition();
      recognition.lang = 'zh-CN';
      recognition.interimResults = false;
      voiceRecordBtn.classList.add('listening');
      recognition.start();
      recognition.onresult = function(event) {
        recordTextarea.value += (recordTextarea.value ? '\n' : '') + event.results[0][0].transcript;
      };
      recognition.onerror = function() { showToast('语音识别失败', 'error'); };
      recognition.onend = function() { voiceRecordBtn.classList.remove('listening'); };
    });
  }

  // Submit medical record
  var recordSubmit = document.getElementById('recordSubmit');
  if (recordSubmit) {
    recordSubmit.addEventListener('click', function() {
      var overlay = document.getElementById('modalOverlay');
      if (overlay) {
        overlay.classList.add('show');
        document.body.style.overflow = 'hidden';
      }
    });
  }
})();

// ===== Admin Panel - Tab switching within dashboard =====
(function() {
  var adminNavLinks = document.querySelectorAll('.dashboard-nav a[data-section]');
  adminNavLinks.forEach(function(link) {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      adminNavLinks.forEach(function(l) { l.classList.remove('active'); });
      this.classList.add('active');
      var sectionId = this.getAttribute('data-section');
      var sections = document.querySelectorAll('.admin-section');
      sections.forEach(function(s) { s.style.display = 'none'; });
      var target = document.getElementById('section-' + sectionId);
      if (target) target.style.display = 'block';
    });
  });
})();

console.log('大冲村诊所-健康医疗 - 多页面网站已就绪 (含语音/AI/无障碍功能)');
