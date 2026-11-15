require('dotenv').config();
const store = require('./jsonStore');
const bcrypt = require('bcryptjs');

// --- Admin account -----------------------------------------------------
if (store.isEmpty('admins')) {
  const hash = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'ChangeMe123!', 10);
  store.addAdmin(process.env.ADMIN_USERNAME || 'admin', hash, { role: 'owner' });
  console.log('Seeded admin account (see README for credentials).');
}

// --- Site settings -------------------------------------------------------
const defaultSettings = {
  site_name: 'Akure Anglican Youth Fellowship',
  tagline: 'Towards the Perfect Man',
  office_address: 'Diocese of Akure (Anglican Communion), Office Complex Diocesan Headquarters Akure/Owo Road, Alagbaka, P.O. Box 1622, Ondo State',
  email_1: 'Info@ayfakure.org.ng',
  email_2: 'ayfdioceseofakure@gmail.com',
  email_3: 'akuredioesanyouth@gmail.com',
  phone_1: '+2348039249145',
  phone_2: '+234708995505',
  phone_3: '+2348035742321',
  phone_4: '+2348166632209',
  donate_verse: 'Give, and it will be given to you: good measure, pressed down, shaken together, and running over will be put into your bosom. For with the same measure that you use, it will be measured back to you.',
  donate_verse_ref: 'LUKE 6:38',
  donate_intro: 'We like to encourage all our youths to please support our work. You can support by praying and giving towards the work of Christ \u2014 you can sponsor any of our programmes or contribute towards it. The Lord will continue to uphold you and bless you. You can also share this with your friends and family, senior brethren in the diaspora, and your fellowship. God bless you.',
  donate_photo_url: '/wp-content/uploads/2023/12/IMG20231216090027-1024x768.jpg',
  paystack_url: '',
  donate_project_bank: 'United Bank for Africa', donate_project_account_name: 'Anglican Youth Fellowship Project Account', donate_project_account_number: '2088067148',
  donate_main_bank: 'First Bank', donate_main_account_name: 'Anglican Youth Fellowship', donate_main_account_number: '2029757563',
  donate_special_bank: 'First City Monument Bank', donate_special_account_name: 'Anglican Youth Fellowship Special Account', donate_special_account_number: '9418911011',
  donate_usd_bank: '', donate_usd_account_name: '', donate_usd_account_number: '',
  logo_url: '/images/ayf-logo.png',
  diocese_crest_url: '/images/diocese-crest.png',
  facebook_url: '', instagram_url: '', twitter_url: '', youtube_url: '', whatsapp_url: '',
  vision: 'To build a spiritually vibrant, united and purpose-driven Anglican youth fellowship committed to Christ, the Church and society.',
  mission: 'To nurture young people through worship, fellowship, discipleship, evangelism, leadership development and service.',
  purpose: 'To raise young Christians who are equipped to live for Christ and contribute meaningfully to the Church and society.',
  history_intro: "What became the Anglican Youth Fellowship Akure Diocese is the offspring of the Akure Diocesan Youth Fellowship. The Pioneer President of the Akure Diocesan Youth Fellowship was Bro. Henry Olugbenga Bankole Ajayi (now Venerable and current Director, Youth Board Akure Anglican Diocese) and the Youth Chaplain then was the now retired Venerable Francis Oludare Orogun \u2014 implying two people headed the affairs of the Youth Body when the Diocese was created.",
  history_intro_2: "Ven. Francis Orogun handed over to Revd. A. A. Adeyemi (now Venerable) as the Youth Chaplain in 2001 during the episcopacy of Rt. Revd Michael Omojoyegbe Ipinmoye. Ven. Adeyemi was the Youth Chaplain for four (4) years and he handed over to Revd. Paul Ogunsakin (now Canon) and he was also in that capacity for three years and handed over to Revd. Roy Fakorede (now Canon) too for four years. All through this period, there was no Diocesan Youth Executives but there were volunteering youths across the Archdeaconries to organize December camps and after each camp, they disappear to reappear for another conference.",
  history_photo_url: "/wp-content/uploads/2023/11/FB_IMG_1696254600891-removebg-preview-e1735741895493-365x391.png",
  leader_quote: "Every young person carries the potential of a mighty work for God's Kingdom. Our calling as a fellowship is to nurture that potential into purpose, and to walk with them until it is fulfilled.",
  leader_quote_attribution: "The Revd. B.S.E Woli, Diocesan Youth Chaplain",
  cta_band_heading: "Ready to Belong?",
  cta_band_body: "Whether you're new to the faith or looking for a fellowship to grow in, there's a place for you at AYF Akure.",
  cta_band_button_label: "Join the Fellowship",
  bishop_name: "The Most Revd Dr. Simeon Oluwole Borokini, PhD, CFAT",
  bishop_title: "Bishop of Akure Diocese & Archbishop of Ondo Ecclesiastical Province",
  bishop_photo_url: "/wp-content/uploads/2026/04/Archbishop-Borokini--750x420.jpg",
};

const existingSettings = store.getSettings();
const toApply = {};
for (const [k, v] of Object.entries(defaultSettings)) {
  if (existingSettings[k] === undefined) toApply[k] = v;
}
if (Object.keys(toApply).length) store.setSettings(toApply);

// --- Hero slides (from the live site's messaging, with real photography) --
if (store.isEmpty('slides')) {
  store.insert('slides', { eyebrow: 'WELCOME', heading: 'Towards the Perfect Man', body: 'The Akure Anglican Youth Fellowship, Diocese of Akure \u2014 building young people in faith, fellowship and service.', button_label: 'Learn More', button_link: '/about', image_url: '/wp-content/uploads/2026/09/ADW_8443-scaled.jpg', sort_order: 1 });
  store.insert('slides', { eyebrow: 'DIOCESE OF AKURE', heading: 'Anglican Youth Fellowship (Nig)', body: 'Building spiritually vibrant, committed and purpose-driven young people for Christ and His Church.', button_label: 'About AYF', button_link: '/about', image_url: '/wp-content/uploads/2023/12/IMG20231216101030-scaled.jpg', sort_order: 2 });
  store.insert('slides', { eyebrow: 'ONE FELLOWSHIP \u00b7 ONE PURPOSE', heading: 'One Vision', body: 'Together, we grow in faith, fellowship, service and Christian leadership.', button_label: 'Explore AYF', button_link: '/about#vision', image_url: '/wp-content/uploads/2026/09/ADW_8459-scaled.jpg', sort_order: 3 });
  store.insert('slides', { eyebrow: 'GET INVOLVED', heading: 'Be Part of the Fellowship', body: "Join us in worship, fellowship, service, evangelism and the advancement of God's Kingdom.", button_label: 'Contact Us', button_link: '/contact', image_url: '/wp-content/uploads/2023/12/IMG20231216135411-scaled.jpg', sort_order: 4 });
}

// --- Leadership: Fathers in God (clergy) --------------------------------
if (store.isEmpty('leaders')) {
  store.insert('leaders', { name: 'The Ven. Henry Bankole Ajayi', role: 'Diocesan Youth Director', bio: 'Pioneer President of the Akure Diocesan Youth Fellowship, now Archdeacon of Akure East Archdeaconry and Director of the Youth Board, Akure Anglican Diocese.', quote: 'A generation that gives thanks in every season, and gives sacrificially of what it has, is a generation God delights to use for His Kingdom.', photo_url: '/wp-content/uploads/2023/12/IMG-20231207-WA0000.jpg', sort_order: 1 });
  store.insert('leaders', { name: 'The Revd. B.S.E Woli', role: 'Diocesan Youth Chaplain', bio: 'Provides spiritual oversight and pastoral direction to the fellowship across the Diocese of Akure.', quote: "Every young person carries the potential of a mighty work for God's Kingdom. Our calling as a fellowship is to nurture that potential into purpose, and to walk with them until it is fulfilled.", photo_url: '/wp-content/uploads/2023/11/IMG-20231126-WA0052-removebg-preview-e1701959395506.png', sort_order: 2 });
  store.insert('leaders', { name: 'The Revd. Abiodun Olufolaji', role: 'Assistant Youth Chaplain', bio: 'Supports the Youth Chaplain in pastoral care, teaching and programme planning for AYF Akure.', quote: 'Faithful teaching and patient pastoral care, given consistently, are what turn a fellowship of young people into a family that keeps its members close to Christ for life.', photo_url: '/wp-content/uploads/2024/01/Rev._Olufolaji_001-removebg-preview.png', sort_order: 3 });
}

// --- Diocesan Executive Council 2024-2027 (real, from /meet-our-executives/) ---
if (store.isEmpty('executives')) {
  const ex = (name, role, phone, email, photo_url, sort_order) =>
    store.insert('executives', { name, role, phone: phone || '', email: email || '', photo_url, sort_order });
  ex('Festus Olalekan Oni', 'Diocesan President', '08039249145', 'festusoni412@gmail.com', '/wp-content/uploads/2023/12/Festus-Oni-e1708351818103.png', 1);
  ex('Olusola Samuel Osunyemi', 'Diocesan Vice-President', '08063806311', 'osunyemi2009@gmail.com', '/wp-content/uploads/2023/12/Osunyemi_Olusola_Samuel-removebg-preview-3.png', 2);
  ex('Lincoln Odunayo Olojugba', 'General Secretary', '08168269216', 'lincolnolojugba@gmail.com', '/wp-content/uploads/2023/12/IMG_20220522_191517-Lincoln-Olojugba-1.jpg', 3);
  ex('Bisola Stella Olowomeye', 'Assistant General Secretary', '08052575321', 'bisolastella457@gmail.com', '/wp-content/uploads/2024/02/IMG_1305-Bisola-Stella-e1708344418181.jpeg', 4);
  ex('Olakiitan Oluwaseun Adigun', 'Diocesan Treasurer', '09035046838', 'adigunolakiitan@gmail.com', '/wp-content/uploads/2023/12/Snapchat-935251471-Olakiitan-Oluwaseun-2.jpg', 5);
  ex('Rachael Solape Agbadaola', 'Financial Secretary', '07032264468', 'solamy01@gmail.com', '/wp-content/uploads/2023/12/FB_IMG_1690917908251-OGUNMORIYELE-RACHAEL.jpg', 6);
  ex('Samuel Tope Falade', 'Public Relations Officer', '08066523903', 'topeflade54@yahoo.com', '/wp-content/uploads/2023/12/IMG_20230430_221454_279-Tope-Falade.jpg', 7);
  ex('Goodness Mercy Olorunyolemi', 'Assistant Public Relations Officer I', '09060121209', 'goodnessolorunyolemi@gmail.com', '/wp-content/uploads/2024/02/IMG_20240129_114608-Goodness-Olorunyolemi-scaled-e1708344960582.jpg', 8);
  ex('Ebenezer Olakunle Awotiku', 'Assistant Public Relations Officer II', '07060454155', 'awotikueben@gmail.com', '/wp-content/uploads/2024/02/IMG_20240107_152145_400-AWOTIKU-EBENEZER-AKINKUNLE-1-scaled-e1708346132614.jpg', 9);
  ex('Pelumi Seun Fakinlede', 'Youth Star Coordinator', '07030899505', 'jimisaanu@gmail.com', '/wp-content/uploads/2023/12/Pelu.jpg', 10);
  ex('Emmanuel Chukwuebuka Mathias', 'Assistant Youth Star Coordinator', '09134729048', 'emmanuelgnet8@gmail.com', '/wp-content/uploads/2023/12/IMG-20231015-WA0005-Emmanuel-Godson-Emmanuel-mathias-1.jpg', 11);
  ex('Aderonke Meay Oloye', 'Sisters\u2019 Coordinator', '08135892859', 'meayfad@gmail.com', '/wp-content/uploads/2023/12/Aderonke-Oloye-2-e1708535157611.jpg', 12);
  ex('Atinuke Oyebode', 'Assistant Sisters\u2019 Coordinator', '', '', '/wp-content/uploads/2024/03/Atinuke-Oyebode.png', 13);
  ex('Olusola Fapohunda', 'Prayer Coordinator', '08149475139', 'davidoluwafemiadedeke@gmail.com', '/wp-content/uploads/2024/03/OSola-2.jpg', 14);
  ex('Oluwatayo Emmanuel Adeusi', 'Assistant Prayer Coordinator', '08135840201', 'oluwatayoadeusi@gmail.com', '/wp-content/uploads/2024/03/Adeusi-Oluwatayo-new-1.jpg', 15);
  ex('Akin-Ojo Ifedayo Akinbiire', 'Bible Study Coordinator', '08055550640', 'fedaviv15@gmail.com', '/wp-content/uploads/2023/12/Akinbiire-Ifedayo-e1708530121259.jpg', 16);
  ex('Oluwadunsin Samuel Olabode', 'Evangelism Coordinator', '07064586878', 'oluwadunsinsamuelolabode@gmail.com', '/wp-content/uploads/2023/12/Olabode-Oluwadunsin-Samuel-e1708530158845.jpg', 17);
  ex('Monday Onyemele Obiosa', 'Assistant Evangelism Coordinator', '08066684472', 'obiosamonday@gmail.com', '/wp-content/uploads/2024/02/17020208637482-Monday-Obiosa-1-scaled-e1708529960494.jpg', 18);
  ex('Emmanuel Oyetunji Atolagbe', 'Drama Coordinator', '08167735769', 'atosem23@gmail.com', '/wp-content/uploads/2024/02/IMG_20240120_124544_778-Atolagbe-Emmanuel-scaled-e1708531152508.jpg', 19);
  ex('Oluwatobi Francis Adelana', 'Organizing Coordinator', '07061579444', 'adelanatobi008@gmail.com', '/wp-content/uploads/2023/12/PRO.jpg', 20);
  ex('Sunday Oluwaseun Falusi', 'Assistant Organizing Coordinator I', '08038026342', 'phalusy@yahoo.com', '/wp-content/uploads/2024/03/IMG-20230812-WA0013_-_Falusi_Sunday_Oluwaseun-removebg-preview-1-e1710835417255.png', 21);
  ex('Aduramigba Miracle Tomilayo', 'Assistant Organizing Coordinator II', '09054873294', 'aduramigbamiracle@gmail.com', '/wp-content/uploads/2024/03/IMG_20231202_110230_757-Aduramigba-TM-scaled-e1710835751325.jpg', 22);
  ex('Emmanuel Idowu Omoniyi', 'Welfare (Male)', '08066616435', 'theomoscoboy@gmail.com', '/wp-content/uploads/2023/12/IMG_20230909_110240_003-Omoniyi-Emmanuel.jpg', 23);
  ex('Funmilayo Mercy Ige', 'Welfare (Female)', '08164897848', 'funminiyioriginal@gmail.com', '/wp-content/uploads/2023/12/ige-funmilayo.jpg', 24);
  ex('Temitope Blessing Akinrinlola', 'Music Director', '07069446807', 'akinrinlolatemitope100@gmail.com', '/wp-content/uploads/2023/12/Temitope-Akins.jpg', 25);
  ex('Philips Muyiwa Adesina', 'Assistant Music Director', '08134372374', 'muyiwaphil@gmail.com', '/wp-content/uploads/2024/03/PXL_20220724_164354718-Muyiwa-Philips-scaled-e1710834630728.jpg', 26);
  ex('George Temidayo Oladeji', 'Sports Director', '08060838123', 'oladejigeorge@gmail.com', '/wp-content/uploads/2023/12/George-Oladeji-e1710834444341.jpg', 27);
  ex('Olawale Michael Ajana', 'Assistant Sports Director', '07062164565', 'olawaleajana@gmail.com', '/wp-content/uploads/2024/02/IMG_20231229_093309-Olawale-Ajana-scaled-e1708530791167.jpg', 28);
  ex('Temitope Olatoye', 'Internal Auditor', '08034127182', '', '/wp-content/uploads/2024/05/Tope-e1716810248338.jpg', 29);
  ex('Molayo Femi Adesunloro', 'Legal Adviser', '08165060353', 'molayoadesunloro@gmail.com', '/wp-content/uploads/2024/02/IMG_20231103_154305_511-mount-zion-Femi-scaled-e1716810309977.jpg', 30);
}

// --- Past Presidents (real, from /meet-our-executives/) -------------------
if (store.isEmpty('pastPresidents')) {
  store.insert('pastPresidents', { name: 'Bro. Joseph Karuwe', tenure: 'Chairman, Central Working Committee & President, 2009\u20132012', photo_url: '/wp-content/uploads/2023/12/IMG-20231201-WA0049-e1701444273616.jpg', sort_order: 1 });
  store.insert('pastPresidents', { name: 'Late Bro. Olubunmi Bamidele Afuye', tenure: 'President, 2012\u20132018', photo_url: '/wp-content/uploads/2023/12/IMG-20231201-WA0038.jpg', sort_order: 2 });
  store.insert('pastPresidents', { name: 'Dr. Oluwafemi Samuel Abe', tenure: 'President, 2018\u20132021', photo_url: '/wp-content/uploads/2023/12/IMG-20231201-WA0047.jpg', sort_order: 3 });
}

// --- Patrons & Patroness (real, from /our-patrons-patroness/) -------------
if (store.isEmpty('patrons')) {
  const pa = (name, role, photo_url, sort_order) => store.insert('patrons', { name, role, photo_url, sort_order });
  pa('Prof. (Mrs) Funmi Sawe', 'Patroness', '/wp-content/uploads/2024/04/Prof__Mrs__Funmi_Sawe-removebg-preview.png', 1);
  pa('Elder Tunde Adesida', 'Patron', '/wp-content/uploads/2024/04/Picture_of_Elder_Tunde_Adesida-removebg-preview.png', 2);
  pa('Chief Segun Odusanya', 'Patron', '/wp-content/uploads/2024/04/Chief_Segun_Odusanya-removebg-preview.png', 3);
  pa('Lanre Aremo (Esq)', 'Patron', '/wp-content/uploads/2024/04/Lanre_Aremo_ESQ-removebg-preview.png', 4);
  pa('Mrs. J. B. Fayose', 'Patroness', '/wp-content/uploads/2024/04/Fayose-removebg-preview-1.png', 5);
  pa('Justice Ademola Enikuomehin', 'Patron', '/wp-content/uploads/2024/04/Hon._Justice_Ademola_Enikuomehin-removebg-preview.png', 6);
  pa('Barr. Nelson Okoli', 'Patron', '/wp-content/uploads/2024/04/Barr._Nelson_Okoli-removebg-preview.png', 7);
  pa('Dr. (Mrs) Taiwo Adigun', 'Patroness', '/wp-content/uploads/2024/04/Adigun-removebg-preview-e1713459632348.png', 8);
  pa('Prince Philip Akinbola', 'Patron', '/wp-content/uploads/2024/01/18942381-e1705316510641.jpg', 9);
  pa('Chief Bunmi Alade', 'Patron', '/wp-content/uploads/2024/04/Chief_Bunmi_Alade-removebg-preview.png', 10);
  pa('Chief (Mag) Olufunke Adegoroye', 'Patroness', '/wp-content/uploads/2024/04/Chief__Magistrate__Olufunke_Adegoroye-removebg-preview.png', 11);
  pa('Mr. Ayo Dare', 'Patron', '/wp-content/uploads/2024/01/18942381-e1705316510641.jpg', 12);
}

// --- Long-form history article --------------------------------------------
if (store.isEmpty('articles')) {
  const body = `<p>The Anglican Youth Fellowship began nationally as a mustard seed planted in the mid-1940s, following a visit by the Bishop of Lagos, the Rt. Rev. Dr. Leslie Gordon Vining, to England, accompanied by the Canon Residentiary of the Cathedral Church of Lagos, the Rev. A. W. Howells.</p>
<p>What became the Anglican Youth Fellowship Akure Diocese is the offspring of the Akure Diocesan Youth Fellowship. The Pioneer President of the Akure Diocesan Youth Fellowship was Bro. Henry Olugbenga Bankole Ajayi (now Venerable and current Director, Youth Board Akure Anglican Diocese) and the Youth Chaplain then was the now retired Venerable Francis Oludare Orogun \u2014 implying two people headed the affairs of what seemed like the Youth Body of the Diocese when the Diocese was created.</p>
<p>Ven. Francis Orogun handed over to Revd. A. A. Adeyemi (now Venerable) as the Youth Chaplain in 2001 during the episcopacy of Rt. Revd Michael Omojoyegbe Ipinmoye. Ven. Adeyemi was the Youth Chaplain for four (4) years and handed over to Revd. Paul Ogunsakin (now Canon), who served for three years before handing over to Revd. Roy Fakorede (now Canon) for four years. All through this period, there was no Diocesan Youth Executive, but volunteering youths across the Archdeaconries organised December camps, reconvening for the next conference each year.</p>
<p>After the 2009 Diocesan Youth Camp, the camp organising team decided to run other programmes within the year, forming the Diocesan Youth Central Working Committee with Bro Joseph Karuwe (St Luke's Anglican Church, Idi Agba) as Chairman and Sis. Mobolaji Kola-Oloye as Secretary, alongside Bro Oreoluwa Akinbola, Sis Wunmi Daropale, Sis Toyin Olofinyokun and others. In 2010, the Committee began visiting parishes to gather Presidents' contacts, running a Prayer Conference, Joint Fellowship and a Vigil through to 2011, even after the Chairman relocated to Ghana.</p>
<p>In 2012, the Central Working Committee and Youth Chaplain Revd. Roy Fakorede saw the need for a formidable Diocesan Executive. After much prayer, Bro Olubunmi Afuye (Parish President, St Andrew's Anglican Church Oyemekun) was selected as Diocesan President, with Bro Oreoluwa Akinbola as Vice President, Sister Mobolaji Kola-Oloye as General Secretary, Bro. Wale Arowolo (Ilara Mokin) as Bible Study Coordinator, Sis Aanu Orimidupa for Welfare, and Bro. Lanre Olaleye (now a Priest in Akoko Diocese) as Prayer Coordinator, later handing over to Bro Omoniyi Akinbobola (now a Priest in Lagos West Diocese) on his admission to seminary. This Executive was commissioned at the 2012 camp.</p>
<p>In 2013, during the episcopacy of Bishop Michael Omojuyigbe Ipinmoye, a directive came from St Matthias' House \u2014 seat of the Primate of the Church of Nigeria (Anglican Communion) \u2014 that persons over 40 should leave the AYF, and that all church youth groups should be styled Anglican Youth Fellowship. This took effect during the tenure of Revd. Stephen Sanni (now Venerable) as Youth Chaplain; Bishop Ipinmoye mandated him to act on the letter, and Parishes and Archdeaconries gradually adopted the Anglican Youth Fellowship name while continuing their existing programmes.</p>
<p>Since 2013 the fellowship has continued to grow \u2014 the 2013 National Conference held at Umuahia was the first the Diocesan Youth Body attended as Anglican Youth Fellowship. Presidents since then: <strong>Bro. Olubunmi Afuye</strong> (now late), 2013\u20132018; <strong>Dr. Oluwafemi Abe</strong>, 2018\u20132021; and <strong>Bro. Festus Olalekan Oni</strong>, 2021 to date.</p>`;
  store.insert('articles', { title: 'AYF Akure in a Nutshell', author: 'AYF Akure Secretariat', body, image_url: '/wp-content/uploads/2023/11/logo-750x420.png', published_at: '2023-11-01' });
}

// --- News (real headlines carried over from the current site's News & Event
// archive, so the section launches with substance instead of placeholders) --
if (store.isEmpty('news')) {
  const insert = (title, category, excerpt, body, image_url, published_at) =>
    store.insert('news', { title, category, excerpt, body, image_url, published_at });

  insert(
    'Ven. Henry Ajayi Encourages Gratitude and Sacrificial Giving at Harvest Thanksgiving',
    'Diocese',
    'The Diocesan Youth Director preached on gratitude and sacrificial giving at this year\u2019s Harvest Thanksgiving service, drawing on Genesis 4:4.',
    'Preaching at this year\u2019s Harvest Thanksgiving service under the theme "Harvest of Appreciative Heart," Ven. Henry Olugbenga Bankole Ajayi, Archdeacon of Akure East Archdeaconry and Diocesan Youth Director, drew inspiration from Genesis 4:4 to share lessons on gratitude, sacrificial giving, and honouring God with one\u2019s resources.\n\nHe opened his sermon with heartfelt appreciation to God for the lives of all youth members across the Diocese, emphasising the importance of maintaining a thankful heart in every season. He went on to note that giving to God should be intentional and sacrificial, urging the congregation that a culture of generosity ought to be instilled in children from an early age.\n\nVen. Ajayi also thanked the Archbishop of Ondo Ecclesiastical Province, The Most Rev\u2019d Simeon Oluwole Borokini, and the Dean of St. David\u2019s Cathedral, for their continued support of the youth ministry across the Diocese.',
    '/wp-content/uploads/2024/12/IMG-20241221-WA0015-e1735286213405-662x420.jpg',
    '2024-12-21'
  );
  insert(
    'New Year Welcome Address by the AYF Akure Diocesan President',
    'Message',
    'President Festus Olalekan Oni welcomes the fellowship into 2026 under the theme "If God Be for Us, Who Can Be Against Us?" (Romans 8:31), and calls for prayer as the Diocesan Bishop prepares to retire.',
    'Fellowship! In Christ Jesus!\n\nBeloved people of God, I greet you all in the precious name of our Lord and Saviour Jesus Christ. Amen.\n\nIt is with profound joy, gratitude, and thanksgiving to Almighty God that I warmly welcome you into the Year 2026. We return all glory, honour, and adoration to God, who in His mercy and faithfulness has preserved our lives and brought us safely into a new year.\n\nThe theme before us, "If God Be for Us, Who Can Be Against Us?" taken from Romans 8:31, is both reassuring and empowering. It reminds us that the presence of God in our lives is the ultimate assurance of victory. In a world filled with uncertainties, challenges, and spiritual battles, this divine truth anchors our faith and renews our confidence. When God stands with us, no opposition \u2014 physical, spiritual, or emotional \u2014 can prevail against His divine purpose for our lives.\n\nAs youths of Akure Anglican Diocese, we are called to enter this year with bold faith, unwavering hope, and renewed commitment to Christ. The assurance of God\u2019s support should propel us into lives of holiness, service, discipline, and obedience. We must live as ambassadors of Christ, shining lights in our families, churches, communities, and society at large.\n\nThe year 2026 beckons us to deeper fellowship, stronger unity, and greater dedication to the mission of the Church. Let us arise as youths who trust God completely, fear Him reverently, and serve Him wholeheartedly. When God is for us, discouragement loses its grip, fear gives way to faith, and limitations are transformed into testimonies.\n\nLet\u2019s be reminded that this year is a special year in Akure Diocese, as our Diocesan, The Most Revd. Simeon Oluwole Borokini, Ph.D., CFAT, and Mama Province, Princess Christianah Adetunbi Borokini, will be retiring and a new Bishop will be elected. It is our duty to stand in the gap, praying fervently for a smooth retirement and seeking God\u2019s face for a man after His own heart.\n\nOn behalf of the Anglican Youth Fellowship, Akure Diocese, I warmly welcome every one of you \u2014 our Fathers and Mothers in the Lord, our Patrons and Patronesses, and our distinguished fellow youths.\n\nAs we journey through this year, may the Lord go before us, stand beside us, and surround us with His unfailing love. May 2026 be a year of spiritual growth, divine protection, uncommon breakthroughs, and enduring testimonies for us all.\n\nOnce again, you are warmly welcome to the Year 2026, and may God bless you richly as we journey together.\n\nGod bless you all. Happy New Year and welcome to 2026, in Jesus\u2019 name. Amen.\n\nFestus Olalekan Oni\nPresident, Anglican Youth Fellowship (AYF) Nig.\nAkure Diocesan Council.',
    '/wp-content/uploads/2023/12/Festus-Oni-e1708351818103-538x420.png',
    '2026-01-01'
  );
  insert(
    'The Anglican Diocese of Akure Collates Two New Archdeacons',
    'Diocese',
    'Rev\u2019d Canon Lawrence Kayode Komolafe (Idanre North) and Rev\u2019d Canon Emmanuel Ayodele Adeleye (Iju) were collated as Archdeacons at St. Stephen\u2019s Anglican Church, Iju.',
    'The collation of the new Archdeacons in the persons of Rev\u2019d Canon Lawrence Kayode Komolafe (Idanre North Archdeaconry) and Rev Canon Emmanuel Ayodele Adeleye (Iju Archdeaconry) took place on 26th May 2024, conducted by The Most Rev\u2019d Simeon Oluwole Borokini, PhD, CFAT, Bishop of Akure Diocese and Archbishop of Ondo Ecclesiastical Province, at St. Stephen\u2019s Anglican Church, Iju, Akure North, Ondo State.\n\nThe opening service was conducted by the Archbishop himself, beginning with the processional hymns, followed by a Colour Party presentation from the Boys\u2019 Brigade (Unity Battalion Council), Iju. The preacher for the service was The Rt. Rev\u2019d J.A.F Olusola, Bishop of Ijesa North East Diocese, who emphasised that the Church is called to the Great Commission of soul-winning, and noted that Trinity Sunday is an important season of growth. He encouraged and reminded the new Archdeacons of the work of evangelism within the Church of God.\n\nThe Venerable E. A. Adeleye appreciated the Archbishop of Ondo Province, The Most Revd. Dr. S. O. and Princess Christianah A. Borokini; the Diocesan Bishop of Owo, The Rt. Rev. Dr. Stephen Ayodeji Fagbemi; and the Bishop of Ijesa North East Diocese, The Rt. Rev\u2019d J. A. F. Olusola, for his sermon. He further appreciated the Archdeacons and other clergymen, the Church of God, and family. The programme ended with prayer and benediction, followed by the withdrawal of the Colour Party and the Recessional Hymn.\n\nThe fellowship congratulates the new Archdeacons and wishes them a wonderful ministerial work in Jesus\u2019 name.',
    '',
    '2024-05-26'
  );
  insert(
    'Archbishop Borokini Preferred Ibidunmoye, Olufemi and Others in Akure Diocese',
    'Diocese',
    'The Diocesan Bishop announced eleven clergy preferments \u2014 four to Venerable Archdeacon and seven to Canon \u2014 at the 44th Annual Diocesan Mothers\u2019 Union Conference.',
    'The following clergy were preferred by The Most Revd. Simeon Oluwole Borokini, PhD, CFAT, Diocesan Bishop of Akure and Archbishop of Ondo Ecclesiastical Province, on the occasion of the 44th Annual Diocesan Mothers\u2019 Union Conference, held at St. Andrew\u2019s Anglican Church, Oyemekun, Akure, on Sunday 19th April 2026:\n\nPreferred as Venerable Archdeacon:\n1. The Revd. Canon C. A. Ibidunmoye\n2. The Revd. Canon O. A. Adedoja\n3. The Revd. Canon Prof. A. A. Borokini\n4. The Revd. Canon E. A. Adewale\n\nPreferred as Canon:\n1. The Revd. J. R. Oguntomilayo\n2. The Revd. M. O. Olufemi\n3. The Revd. A. O. Olubisi\n4. The Revd. Engr. E. A. Fadiji\n5. The Revd. T. A. Ademolu\n6. The Revd. T. O. Adefusi\n7. The Revd. Hon. Justice T. M. Adedipe\n\nThe fellowship congratulates all those preferred and wishes them well in their expanded ministries.',
    '/wp-content/uploads/2026/04/Archbishop-Borokini--750x420.jpg',
    '2026-04-19'
  );
  insert(
    'Ven. Professor Ayo Atowoju Becomes New Provost of St. David\u2019s Cathedral, Ijomu-Akure',
    'Diocese',
    'Ven. Prof. Ayodele Adeyinka Atowoju, a New Testament scholar with over two decades in theological academia, has been appointed the new Provost of the Cathedral Church of Saint David.',
    'Akure Diocese Announces New Provost: A Spirit-Led Appointment\n\nIn a significant and spiritually guided development within the Anglican Diocese of Akure, a new Provost has been officially announced.\n\nFollowing a directive from the Archbishop and Lord Bishop of Akure Diocese, The Most Rev\u2019d. Simeon Oluwole Borokini, Ph.D., CFAT, the Chancellor of the Diocese, Hon. Justice Yemi Akintan-Osadebay, convened a meeting of the Cathedral Greater Chapter on Easter Monday, April 6, 2026. The purpose of the meeting was both sacred and strategic: to prayerfully nominate three suitable senior clergy, under the guidance of the Holy Spirit, from whom the Archbishop would subsequently select one, also through divine leading, to serve as the next Provost. This process underscores the Diocese\u2019s enduring commitment to spiritual discernment, order, and adherence to ecclesiastical tradition in leadership selection.\n\nThe Announcement\n\nOn Tuesday, April 7, 2026, the Diocese received the much-anticipated news of the Archbishop\u2019s decision. Through what has been widely acknowledged as the leading of the Holy Spirit, the Archbishop appointed Venerable Professor Ayodele Adeyinka Atowoju as the new Provost. Ven. Prof. Atowoju is a distinguished Anglican cleric and accomplished academic, known for his depth in theological scholarship, commitment to ministry, and years of dedicated service to both the Church and academia. His emergence as Provost reflects not only his wealth of experience but also the confidence reposed in him to provide spiritual and administrative leadership at this critical time.\n\nA New Chapter Begins\n\nThis appointment marks the beginning of a new chapter in the life of the Cathedral and the Diocese at large. It is a moment that calls for gratitude to God, unity among the faithful, and collective support for the new Provost as he assumes this sacred responsibility. Members of the Diocese and the wider Anglican Communion are encouraged to uphold Ven. Prof. Atowoju in prayers, trusting that his tenure will be marked by growth, peace, and continued advancement of the work of God.\n\nProfile of the New Provost\n\nVen. Prof. Ayodele Adeyinka Atowoju is a distinguished Anglican cleric, theologian, and academic administrator with an outstanding record of service to both Church and academia. He holds a B.A. (Hons) in Religious Studies (1997), an M.A. in Religious Studies (2000), and a Ph.D. in New Testament Studies (2009), all obtained from the University of Ibadan, one of Nigeria\u2019s premier institutions.\n\nWith over two decades of teaching experience, he has authored more than 75 academic articles and written nine books spanning New Testament studies, Christian worship, and pastoral theology, and has supervised over 25 PhD students and 60 Master\u2019s students \u2014 contributions that have significantly shaped theological scholarship and clergy formation in Nigeria.\n\nHe has served in several strategic academic roles, including Head of Department, Dean/Acting Dean of Postgraduate Studies, and Faculty Head of Theology, and has contributed to the establishment of Religious Studies departments in several Nigerian universities, including Ajayi Crowther University, Lead City University, Wesley University, and Crowther Graduate Theological Seminary. Until his recent appointment, he served as Rector of Ezekiel College of Theology.\n\nA devoted priest of the Church of Nigeria (Anglican Communion), Ven. Prof. Atowoju has ministered both locally and internationally, including in the United Kingdom, and is a member of the Theological Accreditation and Regulatory Board, contributing to the standardisation and development of theological education. His scholarly and ministerial interests include New Testament Theology, Pastoral Theology, Biblical Exegesis in Greek and Hebrew, and Intercultural Communication, and he is known for promoting holistic theological education, practical ministry training, and entrepreneurial, self-reliant clergy development.\n\nCongratulations to the Church of God, to Akure Anglican Diocese, and to the entire Cathedral Church of St. David, Akure.',
    '/wp-content/uploads/2026/04/1001417827-665x420.png',
    '2026-04-07'
  );
  insert(
    'Archbishop Borokini Raises Alarm Over Economic Hardship',
    'Diocese',
    'The Archbishop rated the current administration 60% and urged sharper focus on job creation and security.',
    'The Archbishop of Ondo Ecclesiastical Province and Bishop of Akure Diocese, The Most Rev\u2019d Dr. Simeon Borokini, expressed concern over the economic hardship facing citizens, rating the current federal administration 60% and calling for stronger focus on job creation and security.',
    '/wp-content/uploads/2025/07/FB_IMG_1752424534591-750x420.jpg',
    '2025-07-05'
  );
  insert(
    'Church of Nigeria Issues Guidelines on Receiving Politicians During Services',
    'Communion',
    'Following a controversial political speech at a church service in Abuja, the Church of Nigeria has issued new guidelines restricting politicians from campaigning from the pulpit.',
    'The Church of Nigeria (Anglican Communion) has issued new guidelines restricting how politicians and government officials are received during church services, following a widely-reported incident at a thanksgiving service in Abuja on 6 July 2025.\n\nAt that service, a serving government minister used the pulpit to criticise political opponents and comment on the 2027 election, a moment that was recorded and circulated widely, drawing concern across the Church about the mixing of partisan politics with worship.\n\nIn response, the Primate of the Church of Nigeria, The Most Revd Dr Henry Ndukuba, convened an Episcopal Consultation with fellow bishops, after which a set of guidelines was issued on 11 July. The guidelines affirm that church services remain open to people of all backgrounds, including politicians, but state that the lectern is reserved for ordained ministers reading and preaching God\u2019s Word, and that any invited guest speaking to a congregation should first be briefed that the church is not a platform for partisan campaigning or political propaganda.\n\nThe Primate\u2019s office described the aim of the guidelines as protecting the Church\u2019s neutrality and spiritual integrity, while avoiding speeches or conduct likely to incite division within the body of Christ.',
    '/wp-content/uploads/2025/07/DSC08599-730x394-1.jpg',
    '2025-07-12'
  );
  insert(
    'Idanre Missionary Diocese Created as Church of Nigeria Approves 15 New Dioceses',
    'Communion',
    'The Standing Committee of the Church of Nigeria approved 15 new Dioceses in September 2025, including Idanre Missionary Diocese, carved out of Akure Diocese \u2014 bringing the national total to 176.',
    'The Standing Committee of the Church of Nigeria, Anglican Communion, has approved the creation of 15 new Dioceses in addition to the 161 already existing across the country \u2014 five full-fledged and ten missionary. They are as follows: Full-fledged Dioceses \u2014 Ekiti South, Kalabari, Lagos South West, Omoku and Ozoro; Missionary Dioceses \u2014 Eket, Idanre, Ikom, Keffi, Nasarawa, Ogoja, Oyo South, Oyun, Takum and Zuru.\n\nThe approval came after several visits, inspections and validation processes targeted at verifying the status of the applications received for the creation of the new Dioceses. Recall that three Inspection Teams were set up in September 2024, after the moratorium on creating new Dioceses was lifted, to receive, inspect and verify all applications: Old Province 1 headed by Archbishop Joseph Akinfenwa, Old Province 2 headed by Archbishop David Onuoha, and Old Province 3 headed by Archbishop Daniel Yisa.\n\nThe Inspection Teams presented their fact-finding report at the Standing Committee held at Niger-Delta Diocese in February 2025, which formed the basis of the assignment given to the Church of Nigeria Validation Team on the creation of full-fledged and missionary Dioceses. The Validation Team was constituted and inaugurated by the Primate on 27th March 2025, headed by the Most Rev\u2019d Dr Timothy Yahaya, and went on to visit, inspect and verify the contents of the Inspection Teams\u2019 report before making its recommendations to the Primate.\n\nAt the Episcopal Synod held on 11th July 2025 at Emmanuel Anglican Church, Iji-Nike, Enugu State, the Primate of All Nigeria, the Most Rev\u2019d Henry Ndukuba, presented the Validation Team\u2019s report and recommendations to the Synod for consideration and approval. The Episcopal Synod approved the presentation and directed that it be considered by the Standing Committee of the General Synod at its further meeting scheduled to hold in Ekiti State from 15th to 19th September 2025.\n\nActing on behalf of the General Synod and in accordance with the provisions of Section 37(a), (b) and (d) of Chapter X of the Constitution and Canons of the Church of Nigeria (Anglican Communion) 2020, the Standing Committee of the General Synod, meeting in Ekiti, approved and accepted the Validation Team\u2019s report and approved the creation of the following Dioceses:\n\nFull-fledged Dioceses: Ekiti South Diocese (out of Ekiti Diocese); Kalabari Diocese (out of Niger Delta Diocese); Lagos South West Diocese (out of Lagos West Diocese); Omoku Diocese (out of Ahoada Diocese); and Ozoro Diocese (out of Oleh Diocese).\n\nMissionary Dioceses: Eket Diocese (out of Uyo Diocese); Idanre Diocese (out of Akure Diocese); Ikom Diocese (out of Calabar Diocese); Keffi Diocese (out of Kubwa and Lafia Dioceses); Nasarawa Diocese (out of Lafia Diocese); Ogoja Diocese (out of Calabar Diocese); Oyo South Diocese (out of Oyo Diocese); Oyun Diocese (out of Kwara Diocese); Takum Diocese (out of Jalingo Diocese); and Zuru Diocese (out of Kebbi Diocese).\n\nOther processes \u2014 election of bishops, consecration, inauguration and enthronement dates \u2014 shall be announced in due course.\n\nFor AYF Akure, the change means that parishes and youth fellowship activities in the Idanre area now fall under the newly created Idanre Missionary Diocese rather than under Akure. The Venerable Bode Otenaike was subsequently elected as the pioneer Bishop of the new Diocese.\n\n\u2014 Korede Akintunde, Communication Officer, Church of Nigeria (Anglican Communion), 18th September 2025.',
    '/wp-content/uploads/2025/09/IMG_1569-860x484-1-750x420.webp',
    '2025-09-19'
  );
  insert(
    'Sarah Mullally Becomes First Female Archbishop of Canterbury; Draws Reaction from GAFCON',
    'Communion',
    'The Church of England\u2019s appointment of Sarah Mullally as the 106th Archbishop of Canterbury has drawn strong reaction from the Church of Nigeria and the wider GAFCON movement.',
    'The Church of England announced in October 2025 that Sarah Mullally, then Bishop of London, would become the 106th Archbishop of Canterbury, the first woman to hold the post in its history. She was formally installed at Canterbury Cathedral in March 2026.\n\nThe appointment drew a sharp response from the Church of Nigeria and other conservative provinces aligned with the Global Anglican Future Conference (GAFCON). Nigerian church leaders pointed to comments Mullally made in 2023 welcoming a Church of England vote to permit prayers of blessing for same-sex couples, arguing that her position on the matter could not be reconciled with Scripture and would deepen existing divisions within the Anglican Communion.\n\nIn the months that followed, GAFCON \u2014 a movement representing conservative Anglican provinces largely across Africa, Asia and Latin America \u2014 convened bishops in Abuja, Nigeria, ahead of Mullally\u2019s installation to discuss the future of the Communion\u2019s leadership structure. Rather than electing a rival to the historic role of Archbishop of Canterbury, GAFCON ultimately announced a new leadership council of its own, headed by Rwanda\u2019s Archbishop Laurent Mbanda, describing it as a move beyond the Communion\u2019s old structures rather than a formal break from them.\n\nThe episode reflects a wider and longstanding tension within global Anglicanism between the Church of England and the Global South provinces \u2014 including the Church of Nigeria, of which the Anglican Diocese of Akure is a part \u2014 over questions of biblical interpretation and Communion leadership.',
    '/wp-content/uploads/2025/10/IMG_1817-346x420.webp',
    '2025-10-08'
  );
  insert(
    'Ven. Lt. Col. Ogbonyomi (rtd) Appointed as Primate Ndukuba\u2019s New Private Secretary',
    'Communion',
    'The Primate of the Church of Nigeria has appointed retired Lt. Col. Venerable Titilope Ogbonyomi, formerly Director of Chaplaincy Services for the Nigerian Army, as his new Private Secretary.',
    'The Primate of the Church of Nigeria, Anglican Communion, The Most Rev\u2019d Dr. Henry C. Ndukuba, has appointed The Venerable (Lt. Col. Rtd) Titilope Ogbonyomi as his new Private Secretary.\n\nAccording to the official appointment letter signed by the General Secretary of the Church of Nigeria, The Venerable Dr. Paul Dajur, the decision recognises Venerable Ogbonyomi\u2019s exemplary commitment, discipline and dedicated service, particularly within the Nigerian Army Protestant Chaplaincy.\n\nVenerable Ogbonyomi\u2019s appointment took effect from 1st October 2025. He succeeds The Venerable Ifeanyi Akunna, who was recently elected as the pioneer bishop of the newly established Missionary Diocese of Ogoja.\n\nA retired Lieutenant Colonel and Venerable in the Anglican Communion, Ogbonyomi previously served as Director of Chaplaincy Services (Protestant) for the Nigerian Army. His distinguished career includes service during the Nigerian Civil War and as Chief of Staff for the ECOMOG Peacekeeping Mission in Liberia. He retired from active military duty in late 2024.\n\nIn his statement, Dr. Dajur expressed confidence that Venerable Ogbonyomi\u2019s passion, dedication and extensive experience will greatly enhance his contribution to the Church, and offered prayers that God, who has called him to this new responsibility, will grant him wisdom, grace and strength to serve faithfully \u2014 to the glory of God and for the good of His Church.\n\n\u2014 Korede Akintunde, Communication Officer, Church of Nigeria (Anglican Communion), 3rd October 2025.',
    '/wp-content/uploads/2025/10/Screenshot_20251003_145909_Facebook-e1759510457248-750x420.jpg',
    '2025-10-03'
  );
  insert(
    'First Phase of Diocesan Creation in the Church of Nigeria is Over \u2014 Primate Ndukuba',
    'Communion',
    'Primate Henry Ndukuba announced that the first phase of creating new full-fledged and missionary Dioceses across the Church of Nigeria has concluded, ahead of the wider round of new Dioceses approved in September 2025.',
    'The Primate of the Church of Nigeria, Anglican Communion, The Most Rev. Henry Ndukuba, announced that the first phase of the process to create new full-fledged and missionary Dioceses across the Church of Nigeria had been completed. The process had begun after a long-standing moratorium on new Dioceses was lifted in September 2024, when validation and inspection teams were set up across the Church\u2019s three ecclesiastical provinces to receive, inspect and verify applications from prospective new Dioceses.\n\nThat groundwork culminated a year later, in September 2025, when the Standing Committee of the General Synod formally approved 15 new Dioceses nationwide \u2014 including Idanre Missionary Diocese, carved out of the Anglican Diocese of Akure \u2014 bringing the Church of Nigeria\u2019s total to 176 Dioceses.',
    '/wp-content/uploads/2024/06/Primate-Ndukuba1-750x420.jpg',
    '2024-06-20'
  );
}

// --- Sample upcoming programmes -------------------------------------------
if (store.isEmpty('programmes')) {
  store.insert('programmes', { title: 'Annual Youth Camp', event_date: '2026-12-18', event_time: '9:00 AM', venue: 'Diocesan Camp Ground, Akure', description: 'Days of worship, teaching and fellowship for youths across all Archdeaconries.', image_url: '' });
  store.insert('programmes', { title: 'Diocesan Youth Conference', event_date: '2026-11-02', event_time: '10:00 AM', venue: 'Cathedral Church Hall, Akure', description: 'A gathering of youth leaders from every Archdeaconry for teaching and strategy.', image_url: '' });
  store.insert('programmes', { title: 'Night of Vigil & Praise', event_date: '2026-09-27', event_time: '10:00 PM', venue: 'Diocesan Headquarters', description: 'An evening of prayer, praise and worship led by the AYF music and drama unit.', image_url: '' });
}

// --- Gallery (real photos from the current site's two published albums,
// organized into the same two named albums used on the live site) --------
if (store.isEmpty('gallery')) {
  const vigil = ['8443','8445','8446','8448','8449','8450','8451','8459','8460','8461','8463','8466','8467','8468','8469','8470','8472','8474','8476','8477','8478','8479','8480','8483','8484','8486','8489','8491','8492','8494','8495','8496','8498','8500','8501','8502','8503','8504','8505','8506','8507','8510','8515','8516','8517','8518','8519','8520','8521','8522','8523','8524','8525','8528','8529','8530','8531','8533','8536','8537','8539','8540','8541','8550','8551','8554','8555','8559','8562','8566','8568','8570','8571','8573','8575','8579','8581','8584','8586','8587','8589','8595','8597','8598','8600','8601','8602','8603','8604','8606','8607','8608','8610','8614','8616','8617','8618','8621','8626','8628','8630','8632','8634','8637','8639','8642','8646','8647','8649','8654','8658','8659','8662','8663','8665','8666','8669','8670','8672','8673','8677','8680','8681','8696','8698','8700','8702','8703','8704','8705','8706','8708','8712','8713','8717','8718','8721','8722','8725','8730','8737','8748','8750','8753','8758','8761','8762','8765','8766','8770','8773','8775','8786','8788','8792','8795','8800','8803','8826','8831','8834','8844','8848','8852','8853','8860','8868','8870','8871','8872','8873','8874','8876','8891','8899','8909','8913','8914','8929','8930','8931','8935','8938','8939'];
  vigil.forEach((n, i) => store.insert('gallery', {
    title: 'Cross Section Of Youths During 2026 Diocesan Youth Vigil', category: 'Cross Section Of Youths During 2026 Diocesan Youth Vigil',
    image_url: `/wp-content/uploads/2026/09/ADW_${n}-scaled.jpg`,
    created_at: new Date(Date.now() - i * 1000).toISOString()
  }));
  const bibleStudy = ['101030','101027','101036','102754','102744','102735','100655','110924','110942','135411','122411','135407','135426','231206','231932','232117','135430','100057','095555','095535','100339','094011','094008','090304','090032','090027','090025','085915','094012','100341','100416'];
  bibleStudy.forEach((n, i) => store.insert('gallery', {
    title: 'Cross Section Of Youths During 2023 Diocesan Bible Study Conference', category: 'Cross Section Of Youths During 2023 Diocesan Bible Study Conference',
    image_url: `/wp-content/uploads/2023/12/IMG20231216${n}-scaled.jpg`,
    created_at: new Date(Date.now() - (100000 + i) * 1000).toISOString()
  }));
}

// --- Video (mirrors the live site's YouTube section) ----------------------
if (store.isEmpty('videos')) {
  store.insert('videos', { title: 'Fellowship video highlight', video_url: '/wp-content/uploads/2025/09/VID-20250911-WA0008.mp4', thumbnail_url: '', published_at: '2025-09-11' });
}

// --- Magazine (real issue from the current site) ---------------------------
if (store.isEmpty('magazines')) {
  store.insert('magazines', {
    title: 'AYF Akure Magazine',
    description: 'The official magazine of the Anglican Youth Fellowship, Akure Diocese.',
    cover_image_url: '',
    file_url: '/wp-content/uploads/2024/12/magazine.pdf',
    issue_date: '2024-12-01'
  });
}

// --- Archdeaconries: the full list of 23 under Akure Diocese ---------------
// (Iju, Akure East and Ilara-Mokin are seeded with real detail; the rest are
// ready for admin to fill in as confirmed.)
if (store.isEmpty('archdeaconries')) {
  const arch = (name, location, leadership, description, image_url) =>
    store.insert('archdeaconries', { name, location, leadership: leadership || 'To be updated.', contact: '', description: description || `Parishes and youth fellowship activities under ${name}.`, image_url: image_url || '' });

  arch('Cathedral Archdeaconry', 'Ijomu, Akure, Ondo State', null,
    'Seated at St. David\u2019s Cathedral, Ijomu-Akure \u2014 the mother church of the Anglican Diocese of Akure.');
  arch('Igbara-Oke Archdeaconry', 'Igbara-Oke, Ondo State');
  arch('Ilara-Mokin Archdeaconry', 'Ilara-Mokin, Ondo State', null,
    'Ilara-Mokin Archdeaconry Youth Fellowship \u2014 Bro. Wale Arowolo of Ilara-Mokin served as Bible Study Coordinator on the Diocesan Youth Executive commissioned in 2012. Full history to be added.',
    '/wp-content/uploads/2023/12/IMG-20231122-WA0082.jpg');
  arch('Ijare Archdeaconry', 'Ijare, Ondo State');
  arch('Iju Archdeaconry', 'Iju, Akure North, Ondo State',
    'Archdeacon: The Venerable Emmanuel Ayodele Adeleye (collated as Archdeacon 2024). Current Youth Chaplain: Rev\u2019d Oluwadamilare Aregbesola. Pioneer Chaplain: The Venerable Dr. Samuel Ayotola Odubena.',
    'The Iju Archdeaconry Youth Fellowship began in September 1996 at St. Matthew\u2019s Anglican Church, Moferere Street, Iju, meeting every Thursday under pioneer Chaplain Rev. Samuel Ayotola Odubena (now Venerable Dr.). A quarterly programme called "Victory Night" was held from the start, its first edition in December 1996 under the theme "Power as of Old". When Rev. Odubena left Iju in 1997, the fellowship\u2019s first set of Executives was chosen: Mr. Femi Owa (now Rev.) as President/Music Coordinator, Mr. Caleb Olowojola as General Secretary, Mrs. Bidemi John (n\u00e9e Owoseni) as Treasurer, Mr. Awotiku as Financial Secretary, Mrs. Semola Olaleye (n\u00e9e Asebiere) as Evangelist Secretary, Mrs. Titi Afolabi (n\u00e9e Akomolafe) on the Prayer Card, Mr. Kunle Olaleye as Assistant Music Card, Mrs. Funke Owa (n\u00e9e Kayode) as Assistant General Secretary, and Mr. Abiodun Akintoye (now Rev.) as P.R.O. It was from this point that the fellowship was formally constituted as the Iju Archdeaconry Anglican Youth Forum, and marked its 25th anniversary in December 2022 under Rev\u2019d Canon Emmanuel A. Adeleye. The Archdeaconry placed first in the Diocesan Women Organisation Quiz and Anglicanism Competition in both 2022 and 2023.');
  arch('Ita-Ogbolu Archdeaconry', 'Ita-Ogbolu, Ondo State');
  arch('Akure South Archdeaconry', 'Akure, Ondo State');
  arch('Akure North Archdeaconry', 'Akure, Ondo State',
    'Archdeacon: Ven. Stephen Elatuyi (headquartered at St. Luke\u2019s Anglican Church, Idi-Aagba Titun, Akure).');
  arch('Akure Central Archdeaconry', 'Akure, Ondo State');
  arch('Akure West Archdeaconry', 'Akure, Ondo State');
  arch('Oba-Ile Archdeaconry', 'Oba-Ile, Ondo State');
  arch('Ijare West Archdeaconry', 'Ijare, Ondo State');
  arch('Oda Archdeaconry', 'Oda, Ondo State');
  arch('Ipogun-Ayo Archdeaconry', 'Ipogun-Ayo, Ondo State');
  arch('Ero Archdeaconry', 'Ero, Ondo State');
  arch('Akure East Archdeaconry', 'Akure, Ondo State',
    'Archdeacon: The Ven. Henry Olugbenga Bankole Ajayi, who also serves as Diocesan Youth Director.',
    'Akure East Archdeaconry, led by Ven. Henry Bankole Ajayi, hosts Diocesan-wide youth events including the annual Harvest Thanksgiving service.');
  arch('Ijapo Archdeaconry', 'Ijapo, Akure, Ondo State', null, 'Home to All Saints\u2019 Anglican Church, Ijapo, Akure.');
  arch('Ijomu Archdeaconry', 'Ijomu, Akure, Ondo State');
  arch('Ibulesoro Archdeaconry', 'Ibulesoro, Ondo State');
  arch('Alagbaka Archdeaconry', 'Alagbaka, Akure, Ondo State');
  arch('Akure South West Archdeaconry', 'Akure, Ondo State');
  arch('Afunbiowo Archdeaconry', 'Afunbiowo, Ondo State');
  arch('Ayede-Ogbese Missionary Archdeaconry', 'Ayede-Ogbese, Ondo State');
}

console.log('Database seeded.');
