/**
 * AI健康助手 - 核心知识库与交互逻辑
 * 大冲村诊所-健康医疗
 */

// ===== 通用工具函数 =====
function aiAddMessage(containerId, role, content, isHTML) {
  var container = document.getElementById(containerId);
  if (!container) return;
  var msgDiv = document.createElement('div');
  msgDiv.className = 'ai-msg ' + (role === 'bot' ? 'ai-msg-bot' : 'ai-msg-user');
  var avatar = role === 'bot' ? '🤖' : '👤';
  msgDiv.innerHTML = '<div class="ai-msg-avatar">' + avatar + '</div><div class="ai-msg-content">' + (isHTML ? content : '<p>' + content.replace(/\n/g, '<br>') + '</p>') + '</div>';
  container.appendChild(msgDiv);
  container.scrollTop = container.scrollHeight;
}

function aiShowTyping(containerId) {
  var container = document.getElementById(containerId);
  if (!container) return null;
  var typingDiv = document.createElement('div');
  typingDiv.className = 'ai-msg ai-msg-bot ai-typing';
  typingDiv.innerHTML = '<div class="ai-msg-avatar">🤖</div><div class="ai-msg-content"><div class="ai-typing-dots"><span></span><span></span><span></span></div></div>';
  container.appendChild(typingDiv);
  container.scrollTop = container.scrollHeight;
  return typingDiv;
}

function aiRemoveTyping(typingEl) {
  if (typingEl && typingEl.parentNode) {
    typingEl.parentNode.removeChild(typingEl);
  }
}

// ===== 1. 智能问诊 - 症状分析引擎 =====
var symptomKB = {
  // 心血管系统
  '头痛|头晕|头昏': {
    dept: '神经内科/心内科',
    possible: ['偏头痛', '紧张性头痛', '高血压', '颈椎病', '脑供血不足'],
    advice: '建议测量血压，注意休息。若持续头痛或伴有呕吐、视力障碍，请及时就医。避免自行服用止痛药。',
    emergency: ['突发剧烈头痛如"炸裂"感', '头痛伴意识障碍', '头痛伴高热呕吐'],
    lifestyle: '保持规律作息，避免过度劳累和精神紧张，适当进行颈部放松运动。'
  },
  '胸闷|胸痛|心慌|心悸|气短': {
    dept: '心内科',
    possible: ['冠心病', '心绞痛', '心律失常', '心肌炎', '焦虑症'],
    advice: '胸痛症状需高度重视！建议尽快到心内科就诊，进行心电图、心肌酶谱等检查。若胸痛持续不缓解或伴有大汗淋漓，请立即拨打120。',
    emergency: ['胸痛持续超过15分钟', '胸痛伴大汗淋漓', '胸痛放射至左肩/背部', '胸痛伴呼吸困难'],
    lifestyle: '低盐低脂饮食，戒烟限酒，适度运动，控制体重，定期体检。'
  },
  '高血压|血压高': {
    dept: '心内科',
    possible: ['原发性高血压', '继发性高血压', '肾性高血压'],
    advice: '建议每日定时测量血压并记录。若血压持续≥140/90mmHg，需在医生指导下服用降压药。低盐饮食（每日<6g），规律运动。',
    emergency: ['血压突然升至180/120以上', '高血压伴剧烈头痛呕吐', '高血压伴视力模糊'],
    lifestyle: '每天盐摄入<6g，多吃蔬菜水果，每周运动5次以上，每次30分钟，保持健康体重。'
  },
  // 呼吸系统
  '咳嗽|咳痰|喉咙痛|嗓子疼|咽痛': {
    dept: '呼吸内科/耳鼻喉科',
    possible: ['上呼吸道感染', '支气管炎', '咽炎', '过敏性咳嗽', '肺炎'],
    advice: '多喝水，保持室内空气湿润。可含服润喉糖缓解。若咳嗽超过2周或伴有发热、胸痛、呼吸困难，请及时就医。',
    emergency: ['咳嗽伴呼吸困难', '咳出大量鲜血', '咳嗽伴高热不退'],
    lifestyle: '戒烟、避免二手烟，雾霾天戴口罩，保持室内通风，适当锻炼增强免疫力。'
  },
  '发烧|发热|高烧|低烧|体温高': {
    dept: '全科/发热门诊',
    possible: ['病毒性感冒', '流感', '细菌感染', '肺炎', '尿路感染'],
    advice: '体温<38.5℃可物理降温（温水擦浴、退热贴），多饮水。体温≥38.5℃可服用退热药（如对乙酰氨基酚）。持续发热超过3天请就医。',
    emergency: ['体温>40℃', '发热伴抽搐', '发热伴意识模糊', '婴幼儿发热超过38℃'],
    lifestyle: '充分休息，多饮水，清淡饮食，保持室内通风。'
  },
  '流鼻涕|鼻塞|打喷嚏|流涕': {
    dept: '耳鼻喉科/呼吸内科',
    possible: ['过敏性鼻炎', '感冒', '鼻窦炎', '鼻息肉'],
    advice: '可使用生理盐水洗鼻。过敏引起可服用抗组胺药（如氯雷他定）。若症状持续超过2周或伴有黄脓鼻涕、面部疼痛，请就医。',
    emergency: [],
    lifestyle: '避免接触过敏原（花粉、尘螨等），使用空气净化器，定期清洗床单被套。'
  },
  // 消化系统
  '腹痛|肚子疼|胃痛|腹部不适': {
    dept: '消化内科',
    possible: ['胃炎', '胃溃疡', '肠炎', '胆囊炎', '阑尾炎'],
    advice: '注意饮食清淡，避免辛辣刺激食物。若疼痛剧烈、持续不缓解或伴有发热呕吐，请立即就医排除急腹症。',
    emergency: ['突发剧烈腹痛', '腹痛伴呕血或黑便', '右下腹固定压痛（疑似阑尾炎）', '腹痛伴高热'],
    lifestyle: '规律进餐，避免暴饮暴食，少食辛辣油腻食物，保持心情舒畅。'
  },
  '腹泻|拉肚子|水样便': {
    dept: '消化内科',
    possible: ['急性肠炎', '消化不良', '细菌性痢疾', '肠易激综合征'],
    advice: '多补充水分和电解质（口服补液盐），饮食以米粥、面条等易消化食物为主。若腹泻超过3天、伴有高热或血便请就医。',
    emergency: ['腹泻伴严重脱水（口干、尿少）', '腹泻伴高热', '腹泻伴血便'],
    lifestyle: '注意饮食卫生，生熟分开，不吃变质食物，饭前便后洗手。'
  },
  '便秘|大便干燥|排便困难': {
    dept: '消化内科',
    possible: ['功能性便秘', '肠易激综合征', '膳食纤维摄入不足'],
    advice: '增加膳食纤维摄入（全谷物、蔬菜、水果），每天饮水1.5-2L，适当运动。可短期使用乳果糖等温和通便药。',
    emergency: ['便秘伴剧烈腹痛', '完全不排气不排便（警惕肠梗阻）'],
    lifestyle: '每天摄入25-30g膳食纤维，定时排便，不久坐，多运动。'
  },
  '恶心|呕吐|反胃': {
    dept: '消化内科',
    possible: ['急性胃炎', '消化不良', '食物中毒', '孕吐', '颅内压增高'],
    advice: '暂时禁食2-4小时，少量多次饮温水。可服用胃复安止吐。若呕吐持续不止或伴有头痛、腹痛请就医。',
    emergency: ['呕吐物含血或咖啡渣样物', '呕吐伴剧烈头痛', '呕吐伴意识改变'],
    lifestyle: '规律饮食，避免过饥过饱，饭后不要立即躺下。'
  },
  // 骨骼肌肉系统
  '腰疼|腰痛|腰椎|背痛': {
    dept: '骨科/康复科',
    possible: ['腰肌劳损', '腰椎间盘突出', '腰椎骨质增生', '肾结石'],
    advice: '急性期卧床休息1-2天（不宜过久），可热敷缓解。避免久坐弯腰，加强核心肌群锻炼。持续不缓解请就医。',
    emergency: ['腰痛伴下肢麻木无力', '腰痛伴大小便障碍（警惕马尾综合征）', '突发剧烈腰痛'],
    lifestyle: '保持正确坐姿，每45分钟起身活动，睡硬板床，加强腰背肌锻炼（如小燕飞）。'
  },
  '关节痛|关节疼|膝盖痛|腿疼|关节炎': {
    dept: '骨科/风湿免疫科',
    possible: ['骨关节炎', '类风湿关节炎', '痛风', '运动损伤'],
    advice: '减少关节负重活动，可外用消炎止痛药膏。若关节红肿热痛或晨僵超过30分钟，请就医排查风湿免疫疾病。',
    emergency: [],
    lifestyle: '控制体重（减轻关节负重），适度游泳/骑车（对关节友好的运动），补充钙和维生素D。'
  },
  '颈椎|脖子痛|颈肩酸痛|手麻': {
    dept: '骨科/康复科',
    possible: ['颈椎病', '颈肌劳损', '颈椎间盘突出', '肩周炎'],
    advice: '避免长时间低头，每工作45分钟做颈部放松运动。可使用颈椎枕。若出现手臂麻木无力或行走不稳，请及时就医。',
    emergency: ['颈椎痛伴下肢行走不稳', '手臂持续麻木无力'],
    lifestyle: '调整电脑屏幕高度至视线水平，避免"低头族"，常做颈部拉伸操。'
  },
  // 皮肤系统
  '皮肤痒|瘙痒|皮疹|红疹|湿疹|皮炎': {
    dept: '皮肤科',
    possible: ['湿疹', '荨麻疹', '过敏性皮炎', '神经性皮炎', '真菌感染'],
    advice: '避免抓挠（以免感染），暂停使用刺激性护肤品。可外用炉甘石洗剂止痒。若皮疹广泛或伴有呼吸困难，请立即就医。',
    emergency: ['皮疹伴呼吸困难/喉头水肿', '全身大面积水疱'],
    lifestyle: '使用温和无刺激的洗护用品，穿棉质透气衣物，避免已知过敏原。'
  },
  '痘痘|痤疮|粉刺|青春痘': {
    dept: '皮肤科',
    possible: ['寻常痤疮', '激素性痤疮', '化妆品痤疮'],
    advice: '保持面部清洁，每天用温和洁面产品洗脸2次。避免用手挤压痘痘（易留疤）。可外用维A酸类或过氧苯甲酰药膏。',
    emergency: [],
    lifestyle: '清淡饮食（少糖少油），规律作息（不熬夜），选择不致痘的化妆品（标注"非致粉刺性"）。'
  },
  // 神经系统
  '失眠|睡不着|入睡困难|睡眠差|早醒': {
    dept: '神经内科/心理科',
    possible: ['失眠症', '焦虑症', '抑郁症', '睡眠呼吸暂停'],
    advice: '建立规律的睡眠时间，睡前1小时远离手机/电脑。避免午后摄入咖啡因。若失眠持续超过1个月且影响日常生活，请就医。',
    emergency: [],
    lifestyle: '睡前泡热水澡/泡脚放松，卧室保持安静黑暗凉爽，每天固定时间起床（即使周末）。'
  },
  '焦虑|紧张|心慌焦虑|烦躁不安': {
    dept: '心理科/精神科',
    possible: ['焦虑症', '广泛性焦虑障碍', '惊恐障碍', '社交焦虑'],
    advice: '尝试深呼吸放松法（吸气4秒-屏住7秒-呼气8秒）。适度运动有助于缓解焦虑。若焦虑持续超过2周且影响工作生活，请就医。',
    emergency: ['焦虑伴自杀念头', '惊恐发作（濒死感、失控感）'],
    lifestyle: '每周运动3-5次（尤其有氧运动），练习正念冥想，减少咖啡因和酒精摄入。'
  },
  '抑郁|情绪低落|没兴趣|不想动': {
    dept: '心理科/精神科',
    possible: ['抑郁症', '抑郁状态', '双相情感障碍'],
    advice: '抑郁症是可治疗的疾病，请不要独自承受。建议寻求专业心理医生的帮助。多与家人朋友沟通，不要将自己孤立起来。',
    emergency: ['有自杀/自伤念头', '抑郁伴幻觉妄想'],
    lifestyle: '尽量保持社交活动（即使没有动力），每天出门散步15分钟，保证规律作息。'
  },
  // 内分泌系统
  '糖尿病|血糖高|血糖': {
    dept: '内分泌科',
    possible: ['2型糖尿病', '1型糖尿病', '妊娠期糖尿病'],
    advice: '定期监测空腹及餐后血糖，遵医嘱用药（口服降糖药/胰岛素），控制饮食总热量，每周运动150分钟。糖化血红蛋白应<7.0%。',
    emergency: ['血糖>16.7mmol/L伴恶心呕吐', '血糖<3.9mmol/L伴出冷汗心慌'],
    lifestyle: '控制碳水化合物摄入，定时定量进餐，随身携带糖果防低血糖，每年检查眼底和肾功能。'
  },
  // 泌尿系统
  '尿频|尿急|尿痛|小便痛': {
    dept: '泌尿外科/肾内科',
    possible: ['尿路感染', '膀胱炎', '前列腺增生（男性）', '肾盂肾炎'],
    advice: '多喝水（每天>2L），注意个人卫生。如伴有发热、腰痛，可能已发展为肾盂肾炎，需立即就医使用抗生素治疗。',
    emergency: ['尿痛伴高热寒战', '肉眼血尿', '完全不能排尿'],
    lifestyle: '多饮水、不憋尿（每2-3小时排尿一次），女性注意会阴部卫生。'
  },
  // 眼科
  '眼睛干|眼干|视力模糊|视力下降|眼睛痛': {
    dept: '眼科',
    possible: ['干眼症', '近视/远视', '结膜炎', '白内障', '青光眼'],
    advice: '使用人工泪液缓解眼干。每用眼40分钟休息5-10分钟（20-20-20法则：每20分钟看20英尺外20秒）。若视力突然下降或眼痛，请立即就医。',
    emergency: ['突发视力丧失', '眼痛伴恶心呕吐（警惕青光眼）', '眼前大量飞蚊伴闪光感'],
    lifestyle: '减少屏幕使用时间，多进行户外活动（每天≥2小时），补充叶黄素和维生素A。'
  },
  // 口腔
  '牙痛|牙疼|牙龈出血|口腔溃疡': {
    dept: '口腔科',
    possible: ['龋齿（蛀牙）', '牙髓炎', '牙龈炎', '牙周炎', '复发性口腔溃疡'],
    advice: '口腔溃疡可使用西瓜霜喷剂或口腔溃疡贴膜。牙龈出血建议洁牙（洗牙）。牙痛需到口腔科检查是否有蛀牙或牙髓炎。',
    emergency: ['牙痛伴面部肿胀', '拔牙后出血不止'],
    lifestyle: '每天刷牙2次（每次≥2分钟），使用牙线清洁牙缝，每年洁牙1-2次。'
  },
  // 妇科
  '月经不调|月经紊乱|痛经|经痛': {
    dept: '妇科',
    possible: ['内分泌失调', '多囊卵巢综合征', '子宫内膜异位症', '子宫肌瘤'],
    advice: '痛经可热敷腹部，必要时服用布洛芬止痛。若月经紊乱持续3个月以上或痛经严重影响生活，请就医检查。',
    emergency: ['痛经伴大出血（>80ml/周期）', '非经期异常出血'],
    lifestyle: '经期注意保暖，避免生冷食物，适度运动（如瑜伽），保持心情舒畅。'
  },
  // 儿科
  '小儿发热|孩子发烧|宝宝咳嗽|儿童': {
    dept: '儿科',
    possible: ['上呼吸道感染', '幼儿急疹', '手足口病', '支气管炎'],
    advice: '小儿发热可先物理降温，体温≥38.5℃可使用儿童专用退热药（布洛芬或对乙酰氨基酚，按体重计算剂量）。精神状态差或发热超过3天请就医。',
    emergency: ['婴幼儿（<3月龄）体温>38℃', '发热伴抽搐', '精神萎靡、不吃不喝'],
    lifestyle: '按时接种疫苗，勤洗手，保持室内通风，合理喂养增强抵抗力。'
  },
  // 其他常见
  '疲劳|乏力|没精神|浑身无力': {
    dept: '全科/内科',
    possible: ['贫血', '甲状腺功能减退', '慢性疲劳综合征', '睡眠不足', '营养不良'],
    advice: '建议检查血常规、甲状腺功能。保证充足的睡眠（7-8小时），均衡饮食，适度运动反而有助于改善疲劳。',
    emergency: ['突发极度乏力伴意识模糊'],
    lifestyle: '每天睡足7-8小时，均衡营养（尤其注意铁、B12摄入），每周适度运动。'
  },
  '体重增加|肥胖|超重': {
    dept: '内分泌科/营养科',
    possible: ['单纯性肥胖', '甲状腺功能减退', '多囊卵巢综合征', '库欣综合征'],
    advice: '建议计算BMI（体重kg/身高m²）。BMI≥24为超重，≥28为肥胖。控制饮食+运动是最有效的减重方式。减重速度建议每周0.5-1kg。',
    emergency: [],
    lifestyle: '每天减少500kcal热量摄入，每周运动>200分钟，保证蛋白质摄入（防肌肉流失），记录饮食日记。'
  }
};

// 症状分析主函数
function analyzeSymptomsFull(symptom) {
  var s = symptom.toLowerCase();
  var bestMatch = null;
  var bestScore = 0;

  for (var pattern in symptomKB) {
    var keywords = pattern.split('|');
    var score = 0;
    for (var i = 0; i < keywords.length; i++) {
      if (s.indexOf(keywords[i]) >= 0) {
        score += 1;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = symptomKB[pattern];
    }
  }

  if (bestMatch && bestScore > 0) {
    return bestMatch;
  }

  // 兜底分析
  return {
    dept: '全科/内科（建议进一步描述症状）',
    possible: ['症状描述较宽泛，需要更多信息来进行准确判断'],
    advice: '建议您更详细地描述以下信息，以便我们进行更准确的分析：\n1. 具体症状及持续时间\n2. 症状的严重程度和变化趋势\n3. 是否有其他伴随症状\n4. 既往病史和用药情况\n\n建议前往全科门诊进行初步检查。',
    emergency: [],
    lifestyle: '保持健康的生活方式：规律作息、均衡饮食、适度运动、定期体检。'
  };
}

// ===== 2. 用药助手 - 药物知识库 =====
var drugKB = {
  '阿莫西林': {
    type: '青霉素类抗生素',
    indications: '用于敏感菌引起的呼吸道感染、泌尿道感染、皮肤软组织感染等',
    dosage: '成人：每次0.5g，每日3次；儿童：按体重20-40mg/kg/日',
    sideEffects: '恶心、腹泻、皮疹。少数人可能出现过敏反应。',
    warnings: '青霉素过敏者禁用！用药前需做皮试。服用期间如出现皮疹、呼吸困难，立即停药就医。',
    interactions: { '丙磺舒': '可增加阿莫西林血药浓度', '甲氨蝶呤': '合用可能增加甲氨蝶呤毒性', '华法林': '可能增强抗凝效果' }
  },
  '头孢克洛': {
    type: '头孢菌素类抗生素',
    indications: '用于敏感菌引起的呼吸道、泌尿道、皮肤软组织感染',
    dosage: '成人：每次0.25g，每日3次',
    sideEffects: '腹泻、恶心、皮疹。少数人可能出现伪膜性肠炎。',
    warnings: '头孢类过敏者禁用。与青霉素可能有交叉过敏反应。服药期间及停药7天内禁止饮酒！',
    interactions: { '酒精': '引起双硫仑样反应（面部潮红、心悸、呼吸困难）⚠危险', '呋塞米': '可能增加肾毒性' }
  },
  '布洛芬': {
    type: '非甾体抗炎药（NSAID）',
    indications: '用于缓解轻至中度疼痛（头痛、牙痛、痛经）和退热',
    dosage: '成人：每次0.2-0.4g，每日3-4次，每日不超过2.4g',
    sideEffects: '胃肠道不适、恶心、头晕。长期使用可能损伤胃黏膜。',
    warnings: '胃溃疡患者慎用。哮喘患者慎用。孕妇慎用（尤其孕晚期）。饭后服用可减少胃部不适。',
    interactions: { '阿司匹林': '合用增加胃出血风险', '华法林': '增加出血风险', '利尿剂': '可能减弱降压效果' }
  },
  '对乙酰氨基酚': {
    type: '解热镇痛药',
    indications: '用于发热、头痛、肌肉痛等',
    dosage: '成人：每次0.3-0.6g，每日不超过2g',
    sideEffects: '常规剂量下较少。过量可导致严重肝损伤！',
    warnings: '每日最大剂量不超过2g。服药期间禁止饮酒。肝功能不全者慎用。',
    interactions: { '酒精': '显著增加肝毒性风险⚠', '华法林': '长期大剂量合用增加出血风险' }
  },
  '阿司匹林': {
    type: '解热镇痛药/抗血小板药',
    indications: '小剂量用于预防心脑血管疾病；大剂量用于解热镇痛',
    dosage: '抗血小板：每日75-100mg；解热镇痛：每次0.3-0.6g',
    sideEffects: '胃肠道刺激、出血倾向、过敏反应',
    warnings: '胃溃疡患者禁用。手术前需停药（至少5-7天）。儿童病毒感染期间禁用（警惕Reye综合征）。',
    interactions: { '布洛芬': '可能减弱阿司匹林抗血小板作用', '华法林': '显著增加出血风险⚠', '甲氨蝶呤': '增加甲氨蝶呤毒性' }
  },
  '奥美拉唑': {
    type: '质子泵抑制剂（PPI）',
    indications: '用于胃溃疡、十二指肠溃疡、胃食管反流病',
    dosage: '每日1次，每次20mg，早餐前服用',
    sideEffects: '头痛、腹泻、便秘。长期使用可能增加骨折风险和维生素B12缺乏。',
    warnings: '应在早餐前30-60分钟服用。长期用药需在医生指导下进行。',
    interactions: { '氯吡格雷': '可能减弱氯吡格雷抗血小板作用⚠', '酮康唑': '减少酮康唑吸收' }
  },
  '氯雷他定': {
    type: '抗组胺药（第二代）',
    indications: '用于过敏性鼻炎、荨麻疹等过敏性疾病',
    dosage: '成人及12岁以上儿童：每日1次，每次10mg',
    sideEffects: '嗜睡较少（较第一代抗组胺药明显改善），偶有头痛、乏力',
    warnings: '肝功能不全者需减量。服药期间仍应避免驾驶（个体差异）。',
    interactions: { '红霉素': '可能增加氯雷他定血药浓度', '酮康唑': '可能增加氯雷他定血药浓度' }
  },
  '蒙脱石散': {
    type: '消化道黏膜保护剂',
    indications: '用于成人及儿童急慢性腹泻',
    dosage: '成人：每次1袋（3g），每日3次；儿童酌减',
    sideEffects: '偶见便秘。',
    warnings: '需与其他药物间隔至少1-2小时服用（因其吸附作用会影响其他药物吸收）。',
    interactions: { '其他口服药': '间隔至少1-2小时服用，避免影响吸收' }
  },
  '氨氯地平': {
    type: '钙通道阻滞剂（CCB）',
    indications: '用于高血压、冠心病的治疗',
    dosage: '每日1次，每次2.5-5mg，最大10mg',
    sideEffects: '头痛、面部潮红、踝部水肿、心悸',
    warnings: '不可突然停药。服药期间避免大量饮用葡萄柚汁（会增加血药浓度）。',
    interactions: { '葡萄柚汁': '增加氨氯地平血药浓度⚠', '辛伐他汀': '合用需注意剂量限制' }
  },
  '二甲双胍': {
    type: '双胍类口服降糖药',
    indications: '用于2型糖尿病的一线治疗',
    dosage: '从小剂量开始，每次0.25-0.5g，每日2-3次，餐中或餐后服用',
    sideEffects: '恶心、腹泻、食欲减退。少数人可能出现乳酸酸中毒（罕见但危险）。',
    warnings: '肾功能不全者禁用（eGFR<45时）。做增强CT/造影检查前需停药48小时。长期服用需补充维生素B12。',
    interactions: { '酒精': '增加乳酸酸中毒风险⚠', '碘造影剂': '检查前后需暂停用药' }
  },
  '阿托伐他汀': {
    type: '他汀类降脂药',
    indications: '用于高胆固醇血症和混合型高脂血症',
    dosage: '每日1次，每次10-20mg，晚间服用',
    sideEffects: '肌肉疼痛、乏力。少数人可能出现肝酶升高。',
    warnings: '如出现不明原因肌肉疼痛、乏力、尿色变深，立即就医（警惕横纹肌溶解）。定期检查肝功能。',
    interactions: { '克拉霉素': '增加肌病风险', '葡萄柚汁': '增加他汀血药浓度⚠' }
  }
};

function getDrugInfo(drugNames) {
  var names = drugNames.split(/[,，、\s]+/).filter(Boolean);
  var results = [];

  for (var i = 0; i < names.length; i++) {
    var name = names[i].trim();
    var found = null;
    // 模糊匹配
    for (var key in drugKB) {
      if (key.indexOf(name) >= 0 || name.indexOf(key) >= 0) {
        found = drugKB[key];
        name = key;
        break;
      }
    }
    if (found) {
      results.push({ name: name, info: found, found: true });
    } else {
      results.push({ name: name, info: null, found: false });
    }
  }

  return results;
}

function checkDrugInteractions(drugNames) {
  var names = drugNames.split(/[,，、\s]+/).filter(Boolean);
  var foundDrugs = [];
  for (var i = 0; i < names.length; i++) {
    for (var key in drugKB) {
      if (key.indexOf(names[i].trim()) >= 0 || names[i].trim().indexOf(key) >= 0) {
        foundDrugs.push(key);
        break;
      }
    }
  }

  var interactions = [];
  for (var i = 0; i < foundDrugs.length; i++) {
    for (var j = i + 1; j < foundDrugs.length; j++) {
      var drug1 = drugKB[foundDrugs[i]];
      var drug2Name = foundDrugs[j];
      if (drug1.interactions && drug1.interactions[drug2Name]) {
        interactions.push({
          drug1: foundDrugs[i],
          drug2: drug2Name,
          effect: drug1.interactions[drug2Name]
        });
      }
      var drug2 = drugKB[foundDrugs[j]];
      if (drug2.interactions && drug2.interactions[foundDrugs[i]]) {
        interactions.push({
          drug1: foundDrugs[j],
          drug2: foundDrugs[i],
          effect: drug2.interactions[foundDrugs[i]]
        });
      }
    }
  }

  return interactions;
}

// ===== 3. 健康知识问答库 =====
var knowledgeKB = {
  '每天应该喝多少水': '根据《中国居民膳食指南》，成人每天推荐饮水量为1500-1700ml（约7-8杯水）。但具体需求因人而异，受运动量、气温、体重等因素影响。运动量大或天气炎热时需额外补充。判断饮水是否充足的一个简单方法是观察尿液颜色——淡黄色表示水分充足。',
  '高血压患者饮食': '高血压患者饮食建议：1）严格限盐，每日食盐<6g（约一啤酒瓶盖）；2）多摄入富含钾的食物（香蕉、土豆、菠菜）；3）多吃蔬菜水果和全谷物；4）选择低脂乳制品；5）限制红肉摄入，多吃鱼肉、禽肉；6）戒烟限酒；7）控制总热量，保持健康体重。这就是著名的"DASH饮食"模式。',
  '如何预防感冒': '预防感冒和流感的有效措施：1）每年接种流感疫苗（最有效）；2）勤洗手（用肥皂和水洗20秒以上）；3）避免用手触摸眼、鼻、口；4）在流感季节戴口罩、少去人群密集场所；5）保持充足睡眠（7-8小时）；6）均衡饮食，补充维生素C和锌；7）适度运动增强免疫力；8）保持室内通风；9）避免与感冒患者密切接触。',
  '每天走多少步': '根据多项研究，成人每天步行8000-10000步对健康最有益。但关键不在于"步数"本身，而在于：1）每天至少30分钟中高强度步行（快走，心率微微加快）；2）避免久坐，每小时起身活动几分钟；3）循序渐进，不要一开始就走过多。世界卫生组织推荐成人每周至少150分钟中等强度有氧运动。',
  '熬夜有什么危害': '长期熬夜的危害包括：1）免疫力下降，更容易生病；2）记忆力减退，注意力不集中；3）增加心血管疾病风险（高血压、冠心病）；4）内分泌紊乱（皮肤变差、容易发胖）；5）增加糖尿病风险；6）影响情绪，增加焦虑和抑郁风险；7）增加某些癌症风险（WHO已将"昼夜节律紊乱"列为2A类致癌因素）。建议成人每晚睡7-9小时。',
  '糖尿病可以吃水果吗': '糖尿病患者是可以吃水果的，但需注意以下几点：1）选择低GI（血糖生成指数）的水果，如苹果、梨、柚子、草莓、樱桃；2）控制份量，每次约1个拳头大小（100-150g）；3）在两餐之间吃（不要饭后立即吃水果）；4）当血糖控制不理想时（空腹>11mmol/L），建议暂停水果，改为蔬菜（黄瓜、西红柿）替代；5）少吃高糖水果：荔枝、龙眼、榴莲、葡萄干等。',
  '如何缓解颈椎病': '缓解颈椎病的方法：1）调整姿势——电脑屏幕高度应与视线齐平，避免低头；2）每工作45分钟起身活动5分钟，做颈部拉伸（缓慢转头、侧屈）；3）换合适的枕头（高度约自己拳头高，支撑颈部生理曲度）；4）颈部热敷10-15分钟，放松肌肉；5）加强颈部肌肉锻炼（如靠墙站立、头手对抗训练）；6）严重时需就医，进行理疗、牵引或药物治疗。注意：不要盲目按摩（不当按摩可能加重病情）。',
  '儿童疫苗有哪些': '我国为儿童提供的一类疫苗（免费）包括：卡介苗（结核）、乙肝疫苗、脊髓灰质炎疫苗、百白破疫苗、麻腮风疫苗、甲肝疫苗、乙脑疫苗、流脑疫苗等。此外还有二类疫苗（自费、推荐接种）：水痘疫苗、肺炎疫苗、轮状病毒疫苗、手足口病（EV71）疫苗、流感疫苗、HPV疫苗等。具体接种时间表请咨询社区卫生服务中心或参考接种证。',
  '怎么减肥最有效': '科学减重的核心原则：1）制造热量缺口（每天减少300-500kcal摄入），但每日摄入不低于1200kcal（女性）/1500kcal（男性）；2）均衡营养——蛋白质占25-30%（防肌肉流失）、碳水化合物45-55%（选全谷物）、脂肪20-30%；3）每周运动200-300分钟（有氧+力量结合）；4）保证充足睡眠（<6小时睡眠会增加饥饿素分泌）；5）减重速度每周0.5-1kg为宜，过快容易反弹。极低热量饮食和极端节食不可取。',
  '什么是三高': '"三高"是指高血压、高血糖（糖尿病）和高血脂（高脂血症），是现代社会最常见的慢性代谢性疾病。三者常同时存在（代谢综合征），会显著增加心脑血管疾病（心梗、脑卒中）的风险。预防"三高"的关键：健康饮食（低盐低脂低糖）、规律运动（每周≥150分钟）、控制体重、戒烟限酒、定期体检。已确诊"三高"的患者需遵医嘱规律服药。',
  '怎么才能睡好': '改善睡眠质量的10个建议：1）每天固定时间睡觉和起床（即使是周末）；2）睡前1小时远离手机/电脑（蓝光抑制褪黑素分泌）；3）卧室保持安静、黑暗、凉爽（18-22℃最佳）；4）睡前泡热水澡或泡脚（体温先升后降有助于入睡）；5）下午2点后不喝咖啡/茶；6）睡前不要吃大餐或饮酒（酒精破坏深度睡眠）；7）白天适度运动（但睡前3小时内避免剧烈运动）；8）躺下30分钟睡不着就起来（不要在床上"挣扎"）；9）练习深呼吸或冥想放松；10）床只用来睡觉（不要在床上工作、看剧）。'
};

function getKnowledgeAnswer(question) {
  var q = question.toLowerCase();
  var bestMatch = null;
  var bestLen = 0;

  for (var key in knowledgeKB) {
    // 计算关键词匹配
    var matchCount = 0;
    // 拆分问题关键词进行匹配
    if (q.indexOf(key) >= 0 || key.indexOf(q) >= 0) {
      if (key.length > bestLen) {
        bestLen = key.length;
        bestMatch = knowledgeKB[key];
      }
    }
  }

  if (bestMatch) return bestMatch;

  // 模糊匹配：拆分问题中的词
  var words = q.replace(/[？?吗呢啊呀的得了是]/g, '').split('');
  for (var key in knowledgeKB) {
    var keyClean = key.replace(/[？?吗呢啊呀的得了是]/g, '');
    var overlap = 0;
    for (var i = 0; i < words.length; i++) {
      if (keyClean.indexOf(words[i]) >= 0) overlap++;
    }
    if (overlap > keyClean.length * 0.4 && keyClean.length > bestLen) {
      bestLen = keyClean.length;
      bestMatch = knowledgeKB[key];
    }
  }

  if (bestMatch) return bestMatch;

  return '抱歉，关于"' + question + '"，我目前的知识库中还没有详细的答案。建议您：\n\n1. 尝试用更具体的方式重新提问\n2. 在"病症科普"页面查看相关疾病信息\n3. 在"健康资讯"页面浏览健康知识文章\n4. 咨询我们的在线医生团队\n\n我们的知识库正在持续更新中，感谢您的理解。';
}

// ===== 4. 体检报告解读 =====
var reportKB = {
  'ALT|谷丙转氨酶': {
    normal: '0-40 U/L',
    meaning: '谷丙转氨酶主要存在于肝细胞中，是评估肝功能的重要指标。',
    high: 'ALT升高常见于：病毒性肝炎、脂肪肝、酒精性肝损伤、药物性肝损伤、肝硬化等。轻度升高（<80）可能与熬夜、饮酒、剧烈运动有关。',
    advice: '轻度升高建议：戒酒、规律作息、清淡饮食，1-2周后复查。显著升高（>80）或持续升高需就诊消化内科/肝病科。'
  },
  'AST|谷草转氨酶': {
    normal: '0-40 U/L',
    meaning: '谷草转氨酶存在于肝脏、心肌、骨骼肌等组织中。',
    high: 'AST升高常见于：肝损伤、心肌损伤、肌肉损伤等。AST/ALT比值>1提示可能酒精性肝病或肝硬化。',
    advice: '单项AST升高需结合其他指标综合判断，建议咨询医生。'
  },
  '总胆固醇|TC': {
    normal: '<5.2 mmol/L',
    meaning: '总胆固醇是血液中所有脂蛋白所含胆固醇的总和。',
    high: '总胆固醇升高（≥6.2）增加动脉粥样硬化和冠心病风险。常见原因：高脂饮食、缺乏运动、肥胖、甲状腺功能减退、遗传因素。',
    low: '总胆固醇偏低（<3.1）可能与营养不良、甲亢、肝病有关。',
    advice: '升高建议：低脂饮食、增加运动、控制体重。持续升高需在医生指导下服用降脂药（如他汀类）。'
  },
  '甘油三酯|TG': {
    normal: '<1.7 mmol/L',
    meaning: '甘油三酯是血液中最常见的脂肪形式，主要来自饮食摄入。',
    high: '甘油三酯升高与饮食结构（高糖高脂）、缺乏运动、饮酒过量、肥胖、糖尿病有关。显著升高（>5.6）可能诱发急性胰腺炎。',
    advice: '控制饮食（减少精制碳水和含糖饮料）、增加运动、限制饮酒。'
  },
  '空腹血糖|GLU|血糖': {
    normal: '3.9-6.1 mmol/L',
    meaning: '空腹血糖是诊断糖尿病和评估血糖控制的核心指标。',
    high: '6.1-7.0为"空腹血糖受损"（糖尿病前期）；≥7.0（需两次确认）可诊断糖尿病。',
    low: '<3.9为低血糖，可能出现头晕、出冷汗、心慌、甚至昏迷。',
    advice: '血糖偏高建议做OGTT（口服葡萄糖耐量试验）确认。糖尿病前期可通过生活方式干预逆转。'
  },
  '尿酸|UA': {
    normal: '男性：150-420 μmol/L；女性：90-360 μmol/L',
    meaning: '尿酸是嘌呤代谢的最终产物，主要通过肾脏排出。',
    high: '高尿酸血症可导致痛风（关节剧痛）、肾结石、肾功能损害。与高嘌呤饮食（海鲜、动物内脏、啤酒）、肥胖、遗传有关。',
    advice: '限制高嘌呤食物（内脏、海鲜、啤酒）、多饮水（>2L/日）、控制体重。反复痛风发作需药物治疗。'
  },
  '肌酐|Cr': {
    normal: '男性：54-106 μmol/L；女性：44-97 μmol/L',
    meaning: '肌酐是肌肉代谢的产物，由肾脏排出，是评估肾功能的重要指标。',
    high: '肌酐升高提示肾功能减退（急性或慢性肾病），需计算eGFR评估肾功能分期。脱水、高蛋白饮食、剧烈运动也可能导致一过性升高。',
    advice: '肌酐异常需到肾内科就诊，完善尿常规、肾脏B超等检查。'
  },
  '血红蛋白|Hb|HGB': {
    normal: '男性：120-160 g/L；女性：110-150 g/L',
    meaning: '血红蛋白是红细胞中携带氧气的蛋白质。',
    low: '血红蛋白偏低提示贫血。常见原因：缺铁性贫血（最常见）、巨幼细胞贫血（缺乏叶酸/B12）、慢性病贫血、失血。' +
          '根据数值分级：轻度贫血（90-正常值）、中度贫血（60-89）、重度贫血（<60）。',
    high: '血红蛋白偏高可能与吸烟、高原居住、脱水、真性红细胞增多症有关。',
    advice: '贫血需进一步检查铁蛋白、叶酸、维生素B12等明确类型后再针对性治疗。'
  },
  '白细胞|WBC': {
    normal: '3.5-9.5 ×10⁹/L',
    meaning: '白细胞是免疫系统的核心组成部分，参与抵抗感染。',
    high: '白细胞升高常见于：细菌感染（尤其化脓性感染）、炎症、组织损伤。显著升高需排查血液系统疾病。',
    low: '白细胞降低常见于：病毒感染、某些药物影响、自身免疫病、骨髓造血功能障碍。',
    advice: '轻度异常可观察，持续异常或明显异常需到血液科就诊。'
  }
};

function analyzeReport(input) {
  var inputLower = input.toLowerCase();
  var results = [];

  for (var pattern in reportKB) {
    var keys = pattern.split('|');
    for (var i = 0; i < keys.length; i++) {
      if (inputLower.indexOf(keys[i].toLowerCase()) >= 0 || input.indexOf(keys[i]) >= 0) {
        if (results.indexOf(pattern) < 0) {
          results.push(pattern);
        }
        break;
      }
    }
  }

  if (results.length === 0) {
    // 尝试匹配数值
    var hasNumber = /\d+\.?\d*/.test(input);
    if (hasNumber) {
      return [{
        pattern: 'custom',
        analysis: '检测到数值输入。请提供具体的指标名称，以便我们准确解读。例如：\n- "ALT 85" → 查询谷丙转氨酶\n- "总胆固醇 6.2" → 查询血脂\n- "空腹血糖 7.5" → 查询血糖',
        isCustom: true
      }];
    }
    return [{
      pattern: 'notfound',
      analysis: '未识别到已知的体检指标。请尝试输入指标名称（如：ALT、肌酐、尿酸、总胆固醇、空腹血糖等）或指标英文缩写。',
      isCustom: true
    }];
  }

  return results.map(function(pattern) {
    return {
      pattern: pattern,
      data: reportKB[pattern]
    };
  });
}

// ===== 5. 健康评估计算 =====
function calculateHealthAssessment(age, gender, height, weight, sbp, dbp, history, lifestyle) {
  var bmi = weight / ((height / 100) * (height / 100));
  var report = [];

  // BMI评估
  var bmiCategory, bmiAdvice;
  if (bmi < 18.5) { bmiCategory = '偏瘦'; bmiAdvice = '建议增加营养摄入，适当增重。可咨询营养科医生。'; }
  else if (bmi < 24) { bmiCategory = '正常'; bmiAdvice = '体重在健康范围内，请继续保持。'; }
  else if (bmi < 28) { bmiCategory = '超重'; bmiAdvice = '建议通过饮食控制和运动减重，目标BMI<24。'; }
  else { bmiCategory = '肥胖'; bmiAdvice = '建议制定系统减重计划，必要时咨询内分泌科或营养科。'; }

  report.push({
    item: '体重指数 (BMI)',
    value: bmi.toFixed(1) + ' kg/m²',
    status: bmiCategory,
    detail: bmiAdvice
  });

  // 血压评估
  var bpCategory, bpAdvice;
  if (sbp < 120 && dbp < 80) { bpCategory = '理想血压'; bpAdvice = '血压非常理想，请继续保持健康生活方式。'; }
  else if (sbp < 130 && dbp < 85) { bpCategory = '正常高值'; bpAdvice = '血压处于正常偏高水平，建议减少盐摄入、增加运动。'; }
  else if (sbp < 140 && dbp < 90) { bpCategory = '正常高值（高血压前期）'; bpAdvice = '建议生活方式干预：低盐饮食、减重、运动、限酒。'; }
  else if (sbp < 160 && dbp < 100) { bpCategory = '1级高血压'; bpAdvice = '建议就诊心内科，可能需要药物治疗。严格低盐饮食（<6g/日）。'; }
  else if (sbp < 180 && dbp < 110) { bpCategory = '2级高血压'; bpAdvice = '需尽快就医，医生很可能开具降压药。定期监测血压。'; }
  else { bpCategory = '3级高血压（重度）'; bpAdvice = '请立即就医！血压处于危险水平，需要及时药物干预。'; }

  report.push({
    item: '血压',
    value: sbp + '/' + dbp + ' mmHg',
    status: bpCategory,
    detail: bpAdvice
  });

  // 综合风险评估
  var riskFactors = 0;
  var riskDetails = [];
  if (bmi >= 24) { riskFactors++; riskDetails.push('体重超标'); }
  if (sbp >= 140 || dbp >= 90) { riskFactors++; riskDetails.push('高血压'); }
  if (sbp >= 130 && sbp < 140) { riskDetails.push('血压偏高（需关注）'); }

  var riskLevel, riskAdvice;
  if (riskFactors >= 2) {
    riskLevel = '中高风险';
    riskAdvice = '您存在多种心血管疾病风险因素，建议尽快进行全面体检，并咨询医生制定个性化健康管理计划。';
  } else if (riskFactors >= 1) {
    riskLevel = '低中风险';
    riskAdvice = '您有一项需要关注的健康风险因素，建议通过生活方式改善并定期体检。';
  } else {
    riskLevel = '低风险';
    riskAdvice = '您目前的主要健康指标在较理想范围内，请继续保持健康生活方式。每年体检一次即可。';
  }

  report.push({
    item: '综合风险评估',
    value: riskLevel,
    status: riskLevel,
    detail: riskAdvice + (riskDetails.length > 0 ? '\n主要关注点：' + riskDetails.join('、') : '')
  });

  // 生活方式建议
  var tips = [];
  if (bmi >= 24) tips.push('🏃 每周至少运动200分钟，结合有氧和力量训练');
  if (sbp >= 130) tips.push('🧂 每日盐摄入<6g，多吃蔬菜水果（富含钾）');
  tips.push('😴 保证每天7-8小时优质睡眠');
  tips.push('💧 每天饮水1.5-2L');
  tips.push('🚭 戒烟限酒（男性每日酒精<25g，女性<15g）');
  tips.push('🩺 每年定期体检一次');

  return { bmi: bmi, report: report, tips: tips };
}

// ===== 6. 页面交互逻辑 =====
(function() {
  // === 智能问诊 ===
  var symptomSubmit = document.getElementById('symptomSubmit');
  var symptomInput = document.getElementById('symptomInput');
  var symptomClear = document.getElementById('symptomClear');

  if (symptomSubmit && symptomInput) {
    symptomSubmit.addEventListener('click', function() {
      var text = symptomInput.value.trim();
      if (!text) { showToast('请描述您的症状', 'error'); return; }

      aiAddMessage('symptomChatBody', 'user', text);
      var typing = aiShowTyping('symptomChatBody');
      symptomInput.value = '';

      setTimeout(function() {
        aiRemoveTyping(typing);
        var result = analyzeSymptomsFull(text);
        var html = '<h5 style="color:var(--primary);margin-bottom:8px;">🔍 AI分析结果</h5>';
        html += '<p><strong>🏥 推荐科室：</strong>' + result.dept + '</p>';
        html += '<p><strong>🔬 可能相关：</strong>' + result.possible.join('、') + '</p>';
        html += '<p><strong>💡 建议：</strong>' + result.advice.replace(/\n/g, '<br>') + '</p>';
        if (result.lifestyle) {
          html += '<p style="margin-top:8px;"><strong>🌱 生活建议：</strong>' + result.lifestyle + '</p>';
        }
        if (result.emergency && result.emergency.length > 0) {
          html += '<div style="margin-top:12px;padding:12px;background:#fff3e0;border-left:4px solid #e65100;border-radius:0 8px 8px 0;">';
          html += '<strong>🚨 需紧急就医的情况：</strong><ul style="margin:4px 0 0 18px;">';
          result.emergency.forEach(function(e) { html += '<li>' + e + '</li>'; });
          html += '</ul></div>';
        }
        html += '<p style="font-size:12px;color:var(--text-muted);margin-top:8px;">⚠ 本建议仅供参考，不能替代专业医疗诊断。如有不适请及时就医。</p>';
        html += '<button class="btn btn-sm btn-primary" style="margin-top:8px;" onclick="window.location.href=\'appointment.html\'">📅 预约' + result.dept + '</button>';
        aiAddMessage('symptomChatBody', 'bot', html, true);
      }, 1200 + Math.random() * 800);
    });

    symptomInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        symptomSubmit.click();
      }
    });
  }

  if (symptomClear) {
    symptomClear.addEventListener('click', function() {
      symptomInput.value = '';
      var body = document.getElementById('symptomChatBody');
      if (body) {
        body.innerHTML = '<div class="ai-msg ai-msg-bot"><div class="ai-msg-avatar">🤖</div><div class="ai-msg-content"><p>对话已清空。请描述您的症状，我将为您分析。</p></div></div>';
      }
    });
  }

  // 快速症状标签
  var quickTags = document.querySelectorAll('.ai-quick-tag[data-symptom]');
  quickTags.forEach(function(tag) {
    tag.addEventListener('click', function() {
      var symptom = this.getAttribute('data-symptom');
      if (symptomInput) symptomInput.value = symptom;
      if (symptomSubmit) symptomSubmit.click();
      // 切换到智能问诊选项卡
      var tabBtns = document.querySelectorAll('.tab-btn');
      tabBtns.forEach(function(b) { b.classList.remove('active'); });
      var targetTab = document.querySelector('[data-tab="tab-symptom"]');
      if (targetTab) targetTab.classList.add('active');
      var allContents = document.querySelectorAll('.tab-content');
      allContents.forEach(function(c) { c.classList.remove('active'); });
      var symptomTab = document.getElementById('tab-symptom');
      if (symptomTab) symptomTab.classList.add('active');
    });
  });

  // === 用药助手 ===
  var drugSubmit = document.getElementById('drugSubmit');
  var drugInput = document.getElementById('drugInput');
  var drugClear = document.getElementById('drugClear');

  if (drugSubmit && drugInput) {
    drugSubmit.addEventListener('click', function() {
      var text = drugInput.value.trim();
      if (!text) { showToast('请输入药品名称', 'error'); return; }

      aiAddMessage('drugChatBody', 'user', '查询药品：' + text);
      var typing = aiShowTyping('drugChatBody');

      setTimeout(function() {
        aiRemoveTyping(typing);
        var results = getDrugInfo(text);
        var interactions = checkDrugInteractions(text);
        var html = '';

        results.forEach(function(r) {
          if (r.found) {
            var info = r.info;
            html += '<div class="ai-drug-card">';
            html += '<h5>💊 ' + r.name + ' <span style="font-size:12px;color:var(--text-muted);">[' + info.type + ']</span></h5>';
            html += '<p><strong>适应症：</strong>' + info.indications + '</p>';
            html += '<p><strong>常规用量：</strong>' + info.dosage + '</p>';
            html += '<p><strong>常见副作用：</strong>' + info.sideEffects + '</p>';
            html += '<p style="color:#d4734a;"><strong>⚠ 注意事项：</strong>' + info.warnings + '</p>';
            if (info.interactions && Object.keys(info.interactions).length > 0) {
              html += '<p style="margin-top:8px;"><strong>🔄 已知相互作用：</strong></p><ul style="padding-left:18px;">';
              for (var k in info.interactions) {
                html += '<li><strong>' + k + '</strong>：' + info.interactions[k] + '</li>';
              }
              html += '</ul>';
            }
            html += '</div>';
          } else {
            html += '<p>⚠ 未找到"<strong>' + r.name + '</strong>"的药品信息。请检查药品名称是否正确，或尝试输入通用名。</p>';
          }
        });

        if (interactions.length > 0) {
          html += '<div style="margin-top:12px;padding:12px;background:#ffebee;border-left:4px solid #c62828;border-radius:0 8px 8px 0;">';
          html += '<strong>🚨 药物相互作用警告：</strong><ul style="margin:4px 0 0 18px;">';
          interactions.forEach(function(inter) {
            html += '<li><strong>' + inter.drug1 + '</strong> 与 <strong>' + inter.drug2 + '</strong>：' + inter.effect + '</li>';
          });
          html += '</ul></div>';
        }

        html += '<p style="font-size:12px;color:var(--text-muted);margin-top:12px;">⚠ 以上为AI辅助参考信息，不能替代医师和药师的专业判断。请遵医嘱用药。</p>';
        aiAddMessage('drugChatBody', 'bot', html, true);
      }, 1000 + Math.random() * 600);
    });
  }

  if (drugClear) {
    drugClear.addEventListener('click', function() {
      drugInput.value = '';
      var body = document.getElementById('drugChatBody');
      if (body) {
        body.innerHTML = '<div class="ai-msg ai-msg-bot"><div class="ai-msg-avatar">🤖</div><div class="ai-msg-content"><p>对话已清空。请输入药品名称进行查询。</p></div></div>';
      }
    });
  }

  // 快速药品标签
  var drugQuickTags = document.querySelectorAll('.drug-quick');
  drugQuickTags.forEach(function(tag) {
    tag.addEventListener('click', function() {
      if (drugInput) drugInput.value = this.getAttribute('data-drug');
      if (drugSubmit) drugSubmit.click();
      // 切换选项卡
      document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
      var t = document.querySelector('[data-tab="tab-drug"]');
      if (t) t.classList.add('active');
      document.querySelectorAll('.tab-content').forEach(function(c) { c.classList.remove('active'); });
      var drugTab = document.getElementById('tab-drug');
      if (drugTab) drugTab.classList.add('active');
    });
  });

  // === 健康评估 ===
  var assessSubmit = document.getElementById('assessSubmit');
  var assessClear = document.getElementById('assessClear');

  if (assessSubmit) {
    assessSubmit.addEventListener('click', function() {
      var age = parseInt(document.getElementById('assessAge').value) || 0;
      var gender = document.getElementById('assessGender').value;
      var height = parseFloat(document.getElementById('assessHeight').value) || 0;
      var weight = parseFloat(document.getElementById('assessWeight').value) || 0;
      var sbp = parseInt(document.getElementById('assessSbp').value) || 0;
      var dbp = parseInt(document.getElementById('assessDbp').value) || 0;
      var history = document.getElementById('assessHistory').value;
      var lifestyle = document.getElementById('assessLifestyle').value;

      if (!age || !height || !weight || !sbp || !dbp) {
        showToast('请填写完整的健康数据（年龄、身高、体重、血压）', 'error');
        return;
      }

      var typing = aiShowTyping('assessChatBody');

      setTimeout(function() {
        aiRemoveTyping(typing);
        var result = calculateHealthAssessment(age, gender, height, weight, sbp, dbp, history, lifestyle);
        var html = '<h5 style="color:var(--primary);margin-bottom:12px;">📊 您的健康评估报告</h5>';

        result.report.forEach(function(item) {
          var statusClass = '';
          if (item.status.indexOf('正常') >= 0 || item.status.indexOf('理想') >= 0 || item.status.indexOf('低风险') >= 0) {
            statusClass = 'color:#2e7d32;';
          } else if (item.status.indexOf('高') >= 0 || item.status.indexOf('重度') >= 0) {
            statusClass = 'color:#c62828;';
          } else {
            statusClass = 'color:#e65100;';
          }
          html += '<div style="background:#f8fafa;padding:12px;border-radius:8px;margin-bottom:8px;">';
          html += '<strong>' + item.item + '：</strong><span style="' + statusClass + '">' + item.value + ' (' + item.status + ')</span>';
          html += '<p style="font-size:13px;color:var(--text-light);margin-top:4px;">' + item.detail.replace(/\n/g, '<br>') + '</p>';
          html += '</div>';
        });

        html += '<div style="margin-top:12px;"><strong>🌱 健康生活建议：</strong><ul style="padding-left:18px;margin-top:4px;">';
        result.tips.forEach(function(tip) { html += '<li style="font-size:14px;">' + tip + '</li>'; });
        html += '</ul></div>';
        html += '<p style="font-size:12px;color:var(--text-muted);margin-top:8px;">⚠ 本评估仅供健康参考，不构成医疗诊断。请定期体检并咨询医生。</p>';

        aiAddMessage('assessChatBody', 'bot', html, true);
      }, 1500);
    });
  }

  if (assessClear) {
    assessClear.addEventListener('click', function() {
      document.getElementById('assessAge').value = '';
      document.getElementById('assessGender').value = '';
      document.getElementById('assessHeight').value = '';
      document.getElementById('assessWeight').value = '';
      document.getElementById('assessSbp').value = '';
      document.getElementById('assessDbp').value = '';
      document.getElementById('assessHistory').value = '';
      document.getElementById('assessLifestyle').value = '';
      var body = document.getElementById('assessChatBody');
      if (body) body.innerHTML = '<div class="ai-msg ai-msg-bot"><div class="ai-msg-avatar">🤖</div><div class="ai-msg-content"><p>表单已清空。请填写您的健康信息，我将为您生成健康评估报告。</p></div></div>';
    });
  }

  // === 知识问答 ===
  var knowledgeSubmit = document.getElementById('knowledgeSubmit');
  var knowledgeInput = document.getElementById('knowledgeInput');
  var knowledgeClear = document.getElementById('knowledgeClear');

  if (knowledgeSubmit && knowledgeInput) {
    knowledgeSubmit.addEventListener('click', function() {
      var question = knowledgeInput.value.trim();
      if (!question) { showToast('请输入您的问题', 'error'); return; }

      aiAddMessage('knowledgeChatBody', 'user', question);
      var typing = aiShowTyping('knowledgeChatBody');
      knowledgeInput.value = '';

      setTimeout(function() {
        aiRemoveTyping(typing);
        var answer = getKnowledgeAnswer(question);
        aiAddMessage('knowledgeChatBody', 'bot', answer);
        aiAddMessage('knowledgeChatBody', 'bot', '📌 如果您的问题没有得到满意解答，可以尝试换一种方式提问，或浏览我们的<a href="disease.html">病症科普</a>和<a href="news.html">健康资讯</a>页面获取更多信息。', true);
      }, 800 + Math.random() * 1000);
    });

    knowledgeInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        knowledgeSubmit.click();
      }
    });
  }

  if (knowledgeClear) {
    knowledgeClear.addEventListener('click', function() {
      knowledgeInput.value = '';
      var body = document.getElementById('knowledgeChatBody');
      if (body) {
        body.innerHTML = '<div class="ai-msg ai-msg-bot"><div class="ai-msg-avatar">🤖</div><div class="ai-msg-content"><p>对话已清空。请问您想了解什么健康知识？</p></div></div>';
      }
    });
  }

  // 快速知识标签
  var knowledgeQuickTags = document.querySelectorAll('.knowledge-quick');
  knowledgeQuickTags.forEach(function(tag) {
    tag.addEventListener('click', function() {
      var q = this.getAttribute('data-question');
      if (knowledgeInput) knowledgeInput.value = q;
      if (knowledgeSubmit) knowledgeSubmit.click();
      document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
      var t = document.querySelector('[data-tab="tab-knowledge"]');
      if (t) t.classList.add('active');
      document.querySelectorAll('.tab-content').forEach(function(c) { c.classList.remove('active'); });
      var kTab = document.getElementById('tab-knowledge');
      if (kTab) kTab.classList.add('active');
    });
  });

  // === 报告解读 ===
  var reportSubmit = document.getElementById('reportSubmit');
  var reportInput = document.getElementById('reportInput');
  var reportClear = document.getElementById('reportClear');

  if (reportSubmit && reportInput) {
    reportSubmit.addEventListener('click', function() {
      var text = reportInput.value.trim();
      if (!text) { showToast('请输入体检指标', 'error'); return; }

      aiAddMessage('reportChatBody', 'user', '查询指标：' + text);
      var typing = aiShowTyping('reportChatBody');

      setTimeout(function() {
        aiRemoveTyping(typing);
        var results = analyzeReport(text);
        var html = '';

        results.forEach(function(r) {
          if (r.isCustom) {
            html += '<p>' + r.analysis.replace(/\n/g, '<br>') + '</p>';
          } else if (r.data) {
            html += '<div class="ai-drug-card">';
            html += '<h5>📋 ' + r.pattern.replace(/\|/g, '/') + '</h5>';
            html += '<p><strong>正常范围：</strong>' + r.data.normal + '</p>';
            html += '<p><strong>指标含义：</strong>' + r.data.meaning + '</p>';
            if (r.data.high) html += '<p style="color:#e65100;"><strong>⬆ 偏高解读：</strong>' + r.data.high + '</p>';
            if (r.data.low) html += '<p style="color:#1565c0;"><strong>⬇ 偏低解读：</strong>' + r.data.low + '</p>';
            html += '<p style="color:var(--primary);"><strong>💡 建议：</strong>' + r.data.advice + '</p>';
            html += '</div>';
          }
        });

        html += '<p style="font-size:12px;color:var(--text-muted);margin-top:8px;">⚠ 以上解读仅供参考，最终诊断需由执业医师确认。</p>';
        aiAddMessage('reportChatBody', 'bot', html, true);
      }, 1000 + Math.random() * 600);
    });
  }

  if (reportClear) {
    reportClear.addEventListener('click', function() {
      reportInput.value = '';
      var body = document.getElementById('reportChatBody');
      if (body) {
        body.innerHTML = '<div class="ai-msg ai-msg-bot"><div class="ai-msg-avatar">🤖</div><div class="ai-msg-content"><p>对话已清空。请输入您想了解的体检指标。</p></div></div>';
      }
    });
  }

  // 快速报告标签
  var reportQuickTags = document.querySelectorAll('.report-quick');
  reportQuickTags.forEach(function(tag) {
    tag.addEventListener('click', function() {
      var r = this.getAttribute('data-report');
      if (reportInput) reportInput.value = r;
      if (reportSubmit) reportSubmit.click();
      document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
      var t = document.querySelector('[data-tab="tab-report"]');
      if (t) t.classList.add('active');
      document.querySelectorAll('.tab-content').forEach(function(c) { c.classList.remove('active'); });
      var rTab = document.getElementById('tab-report');
      if (rTab) rTab.classList.add('active');
    });
  });

  console.log('🤖 AI健康助手已就绪 - 大冲村诊所-健康医疗');
})();
