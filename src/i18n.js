/**
 * i18n.js  –  Internationalization for Roomate.kz
 * Supports: English (en), Russian (ru), Kazakh (kk)
 *
 * Usage:
 *   import { useLanguage, t, LanguageSwitcher } from './i18n';
 *
 *   const { lang } = useLanguage();
 *   t('nav.map')          // → "Map" / "Карта" / "Карта"
 *
 * Or imperatively (outside React):
 *   import { getCurrentLang, t } from './i18n';
 *   t('common.save')
 */

// ─── Language context (React) ─────────────────────────────────────────────────
import React, { createContext, useContext, useState, useCallback } from 'react';
export const LANG_KEY = 'roomate_kz_lang';

// ─── Translation dictionary ───────────────────────────────────────────────────
export const TRANSLATIONS = {

  // ── English ─────────────────────────────────────────────────────────────────
  en: {
    // Meta
    appName: 'Roomate.kz',
    tagline: 'Made for Kazakhstan',

    // Navigation
    nav: {
      map: 'Map',
      likes: 'Liked',
      profile: 'Profile',
      home: 'Home',
      browse: 'Browse',
      swipe: 'Swipe',
      matches: 'Matches',
      admin: 'Admin',
      logout: '🚪 Logout',
    },

    // Auth
    auth: {
      login: 'Log In',
      register: 'Sign Up',
      email: 'Email',
      password: 'Password',
      rememberMe: 'Remember me',
      forgotPassword: 'Forgot password?',
      welcomeBack: 'Welcome back',
      signInMessage: 'Sign in to find your perfect roommate',
      newHere: "New to Roomate.kz?",
      joinCommunity: 'Join the community',
      alreadyHaveAccount: 'Already have an account?',
      enterApp: 'Enter Roomate.kz',
      loggingIn: 'Logging in…',
      resetPassword: 'Reset Password',
      resetCode: 'Reset Code',
      newPassword: 'New Password',
      sendResetCode: 'Send Reset Code',
      sending: 'Sending…',
      confirmReset: 'Confirm Reset',
      backToLogin: '← Back to Login',
      // Validation alerts
      enterEmail: 'Please enter your email',
      invalidEmail: 'Please enter a valid email address',
      enterPassword: 'Please enter your password',
      passwordRules: 'Password must be at least 8 characters and include an uppercase letter, lowercase letter, number, and special character',
      loginFailed: 'Unable to log in',
      networkError: 'Network error: Check your internet connection or the server may be unavailable. Please try again.',
      invalidCredentials: 'Incorrect email or password',
      accountNotFound: 'Account not found. Please register.',
    },

    // Registration steps
    register: {
      stepBasic: 'Basic Info',
      stepBasicSub: 'Tell us about yourself',
      stepHousing: 'Housing & Work',
      stepLifestyle: 'Lifestyle',
      stepFinal: 'Final Step',
      createProfile: 'Create your profile',
      findMatch: "Let's find your perfect roommate",
      name: 'Full Name',
      age: 'Age',
      gender: 'Gender',
      male: 'Male',
      female: 'Female',
      region: 'Region',
      budget: 'Budget (₸/month)',
      yourSituation: 'Your Situation',
      lookingForPlace: 'Looking for a place',
      lookingForRoommate: 'Looking for a roommate',
      havePlace: 'I have a place',
      wantRoommate: 'Looking for a roommate',
      moveInDate: 'Move-in Date',
      remoteWork: 'Remote Work',
      schedule: 'Schedule',
      languages: 'Languages',
      preferredLanguages: 'Preferred Languages',
      occupation: 'Occupation / Study',
      university: 'University',
      cleanliness: 'Cleanliness',
      sociability: 'Sociability',
      badHabits: 'Habits',
      smoking: 'Smoking',
      alcohol: 'Alcohol',
      pets: 'Pets',
      hasPet: 'Has a pet',
      noPet: 'No pet',
      guests: 'Guests',
      noiseLevel: 'Noise Level',
      religion: 'Religion',
      quiet: 'Quiet',
      moderate: 'Moderate',
      loud: 'Loud',
      yes: 'Yes',
      no: 'No',
      never: 'Never',
      rarely: 'Rarely',
      sometimes: 'Sometimes',
      often: 'Often',
      aboutYourself: 'About Yourself',
      idealRoommate: 'Ideal Roommate',
      quietHours: 'Quiet Hours',
      next: 'Next →',
      back: '← Back',
      createBtn: 'Create Profile 🎉',
      creating: 'Creating…',
      // Validation
      enterName: 'Please enter your name',
      enterValidAge: 'Please enter a valid age',
      selectGender: 'Please select a gender',
      selectRegion: 'Please select a region',
      enterValidBudget: 'Please enter a valid budget',
      selectSituation: 'Please select your situation',
      enterAddress: 'Please enter your address and select it on the map',
    },

    // HomePage
    home: {
      madeInKazakhstan: '🇰🇿 Made for Kazakhstan',
      heroTitle: 'Find your',
      heroTitleItalic: 'perfect',
      heroTitleEnd: 'roommate',
      heroSubtitle: 'From Almaty to Astana — connect with verified roommates matched to your lifestyle.',
      viewProfiles: 'Browse Profiles',
      stats: {
        users: 'Active Users',
        cities: 'Cities in Kazakhstan',
        satisfaction: 'Match Satisfaction',
      },
      features: 'Features',
      whyChoose: 'Why choose Roomate.kz',
      featureList: [
        { icon: '🛡️', title: 'ID Verification', desc: 'Every profile is checked and verified for your safety' },
        { icon: '🗺️', title: '17 Cities', desc: 'From Almaty to Aktau — covering all of Kazakhstan' },
        { icon: '💬', title: '3 Languages', desc: 'Chat in Kazakh, Russian, or English' },
        { icon: '⚡', title: 'Fast Matching', desc: 'Find your ideal roommate in less than a week' },
        { icon: '✨', title: 'Compatibility', desc: 'Detailed compatibility analysis across 20+ criteria' },
      ],
      compatibleRoommates: 'Compatible Roommates',
      exploreProfiles: 'Explore compatible profiles',
      compatibility: 'Compatibility',
      verified: '✓ Verified',
      pending: '⏳ Pending',
      notVerified: '⚠️ Not Verified',
      notSpecified: 'Not specified',
      readyToFind: 'Ready to find',
      yourPerson: 'your person?',
      ctaSubtitle: 'Join 4,200+ people already using Roomate.kz to find compatible roommates across Kazakhstan. Registration is free, forever.',
      viewOnMap: 'Browse profiles on the map',
      freeMatches: 'Free matches · Verified profiles',
      ctaAction: 'Create a free account',
      noCreditCard: 'No payment required · Verification within 24 hours',
    },

    // Footer
    footer: {
      description: "Kazakhstan's first smart roommate-finding service. Lifestyle-based matching across all 17 cities, with ID verification for safety.",
      housing: 'Housing',
      housingLinks: ['Find Rooms', 'List a Place', 'Compatibility Check', 'Safe Deal'],
      locations: 'Locations',
      locationLinks: ['Almaty', 'Astana', 'Shymkent', 'All Cities'],
      resources: 'Resources',
      resourceLinks: ['About Us', 'Trust Center', 'Blog', 'Support'],
      copyright: '© 2026 Roomate.kz · Astana, Kazakhstan',
      privacy: 'Privacy Policy · Terms of Use',
    },

    // Dashboard / tabs
    dashboard: {
      browse: 'Browse',
      swipe: 'Swipe',
      map: 'Map',
      matches: 'Favourites',
      profile: 'Profile',
      connected: '✓ Connected',
      reconnecting: '⟳ Reconnecting…',
    },

    // Browse / Profiles
    browse: {
      searchPlaceholder: 'Search by name…',
      filters: 'Filters',
      budget: 'Budget',
      gender: 'Gender',
      anyGender: 'Any Gender',
      gridView: 'Grid',
      listView: 'List',
      noProfiles: 'No profiles found',
      adjustFilters: 'Try adjusting your filters',
      compatibility: 'Compatibility',
      online: 'Online',
      lookingForPlace: 'Looking for a place',
      lookingForRoommate: 'Looking for a roommate',
      hasPlace: 'Has a place',
      perMonth: '/mo',
    },

    // Profile card / modal
    profile: {
      verified: '✓ Verified',
      pending: ' Pending',
      notVerified: '⚠️ Not Verified',
      addToFavourites: '🤍 Add to Liked',
      inFavourites: '❤️ Liked',
      location: 'Location',
      budget: 'Budget',
      occupation: 'Occupation',
      moveIn: 'Move-in',
      aboutMe: 'About Me',
      idealRoommate: 'Ideal Roommate',
      quietHours: 'Quiet Hours',
      lifestyle: 'Lifestyle',
      cleanliness: 'Cleanliness',
      sociability: 'Sociability',
      hasPet: '🐾 Has a pet',
      remote: ' Remote work',
      nonSmoker: 'Non-smoker',
      nonDrinker: 'Non-drinker',
      interests: 'Interests',
      sendMessage: 'Send a Message',
      oneMessage: 'One message — make it count ✨',
      messagePlaceholder: "Hi, {name}! I saw your profile and…",
      send: 'Send',
      sending: 'Sending…',
      messageSent: '✓ Message sent!',
      messageSentSub: 'If they reply, a chat will open 💬',
      matched: ' Match!',
      matchedSub: '{name} wants to connect',
      openChat: ' Open Chat',
      openFavouritesForChat: 'Open the Favourites tab to chat',
      perMonth: '/mo',
    },

    // Swipe screen
    swipe: {
      heroTitle: 'Find your',
      heroItalic: 'perfect',
      heroTitleEnd: 'roommate',
      subtitle: 'Swipe right to like, left to skip',
      noMore: 'No more profiles',
      noMoreSub: "You've seen everyone in your area. Check back later for new matches!",
      matchScore: 'Match Score',
      ofTotal: 'of',
      clickToView: 'Click to view full profile',
      dragHint: 'Drag to swipe or use buttons',
    },

    // Matches / Likes / Chat
    matches: {
      title: 'Favourites',
      subtitle: 'Your matches and liked profiles',
      noMatches: 'No matches yet',
      noMatchesSub: 'Like profiles to start matching!',
      mutualMatch: 'Mutual Match',
      canChat: 'You can chat freely',
      startChat: 'Start a conversation',
      writeFirst: 'Write your first message to {name}!',
      today: 'Today',
      typingPlaceholder: 'Write a message…',
      likes: 'Liked',
      noLikes: 'No liked profiles yet',
      noLikesSub: 'Browse and like profiles to see them here',
    },

    // Profile edit tab
    profileEdit: {
      title: 'Edit Profile',
      subtitle: 'Keep your info up to date',
      save: 'Save Profile',
      saving: 'Saving…',
      saved: 'Saved!',
      verification: 'Verification',
      verifyNow: 'Verify Now',
      uploadDoc: ' Profile Verification',
      uploadDocSub: 'Upload a clear photo of your passport or national ID (IIN). Review is automated and takes under 24 hours.',
      chooseDoc: 'Choose Document',
      clickOrDrop: 'Click or drag a file',
      fileTypes: 'JPG, PNG (max 10 MB)',
      docChosen: '✓ Document chosen',
      preview: 'Preview',
      cancel: '✕ Cancel',
      submit: '✓ Submit',
      uploading: '⏳ Uploading…',
      selectDocFirst: 'Please select a document',
      uploaded: '✓ Document uploaded! Review will take under 24 hours.',
      uploadError: 'Upload error: ',
      photos: 'Profile Photos',
      mainPhoto: '+ Main Photo',
      photoN: '+ Photo {n}',
      uploading2: ' Uploading…',
      photoTip: 'JPG, PNG · up to 5 MB · auto-saved',
      clickMapToPin: 'Click the map to pin your exact address',
      geocoding: 'Looking up address…',
    },

    // Verification banner
    verifyBanner: {
      message: 'Upload a document to confirm your identity and get more matches',
      cta: 'Verify Now',
    },

    // Verification status notification
    verifyNotif: {
      approved: '✓ Your profile is verified!',
      rejected: '✗ Your profile was rejected',
    },

    // Map
    map: {
      drawAreas: 'Draw Areas',
      clearAll: 'Clear All',
      freehand: 'Freehand',
      circle: 'Circle',
      profilesInArea: 'profiles in area',
      noProfilesInArea: 'No profiles in selected area',
      escToCancel: 'Press Esc to cancel',
      drawingHint: 'Hold and drag to draw a search area',
    },

    // Admin
    admin: {
      title: ' Verification Dashboard',
      subtitle: 'Review and verify profiles',
      pending: ' Pending',
      approved: '✓ Approved',
      rejected: '✗ Rejected',
      review: ' Review',
      details: ' Details',
      noProfiles: 'No profiles',
      info: ' Info',
      age: 'Age',
      gender: 'Gender',
      region: 'Region',
      budget: 'Budget',
      uploadedDoc: ' Uploaded Document',
      rejectionReason: ' Rejection Reason',
      reasonPlaceholder: 'Reason…',
      currentStatus: 'Current Status',
      statusApproved: '✓ Verified',
      statusRejected: '✗ Rejected',
      statusPending: ' Pending',
      reject: '✗ Reject',
      verify: '✓ Verify',
    },

    // Common
    common: {
      loading: 'Loading…',
      save: 'Save',
      cancel: 'Cancel',
      close: 'Close',
      confirm: 'Confirm',
      delete: 'Delete',
      edit: 'Edit',
      back: 'Back',
      next: 'Next',
      yes: 'Yes',
      no: 'No',
      error: 'Error',
      success: 'Success',
      online: 'Online',
      perMonth: '/mo',
      notSpecified: 'Not specified',
    },
  },

  // ── Russian ──────────────────────────────────────────────────────────────────
  ru: {
    appName: 'Roomate.kz',
    tagline: 'Сделано для Казахстана',

    nav: {
      map: 'Карта',
      likes: 'Понравилось',
      profile: 'Профиль',
      home: 'Главная',
      browse: 'Обзор',
      swipe: 'Свайп',
      matches: 'Избранное',
      admin: 'Админ',
      logout: '🚪 Выход',
    },

    auth: {
      login: 'Войти',
      register: 'Зарегистрироваться',
      email: 'Email',
      password: 'Пароль',
      rememberMe: 'Запомнить меня',
      forgotPassword: 'Забыли пароль?',
      welcomeBack: 'С возвращением',
      signInMessage: 'Войдите, чтобы найти идеального соседа',
      newHere: 'Ещё не используете Roomate.kz?',
      joinCommunity: 'Присоединяйтесь к сообществу',
      alreadyHaveAccount: 'Уже есть аккаунт?',
      enterApp: 'Войти в Roomate.kz',
      loggingIn: 'Вход…',
      resetPassword: 'Сброс пароля',
      resetCode: 'Код сброса',
      newPassword: 'Новый пароль',
      sendResetCode: 'Отправить код',
      sending: 'Отправка…',
      confirmReset: 'Подтвердить',
      backToLogin: '← Назад к входу',
      enterEmail: 'Введите email',
      invalidEmail: 'Введите корректный email',
      enterPassword: 'Введите пароль',
      passwordRules: 'Пароль должен содержать минимум 8 символов, включая заглавную букву, строчную букву, цифру и специальный символ',
      loginFailed: 'Не удалось войти в аккаунт',
      networkError: 'Ошибка сети: Проверьте интернет-соединение или сервер может быть недоступен. Попробуйте снова.',
      invalidCredentials: 'Неверный email или пароль',
      accountNotFound: 'Аккаунт не найден. Пожалуйста, зарегистрируйтесь.',
    },

    register: {
      stepBasic: 'Основная информация',
      stepBasicSub: 'Расскажите нам о себе',
      stepHousing: 'Жильё и работа',
      stepLifestyle: 'Образ жизни',
      stepFinal: 'Последний шаг',
      createProfile: 'Создайте профиль',
      findMatch: 'Давайте найдем вашего идеального соседа',
      name: 'Имя',
      age: 'Возраст',
      gender: 'Пол',
      male: 'Мужской',
      female: 'Женский',
      region: 'Регион',
      budget: 'Бюджет (₸/мес)',
      yourSituation: 'Ваша ситуация',
      lookingForPlace: 'Ищу квартиру',
      lookingForRoommate: 'Ищу соседа',
      havePlace: 'Есть квартира',
      wantRoommate: 'Ищу соседа',
      moveInDate: 'Дата заезда',
      remoteWork: 'Удалённая работа',
      schedule: 'График',
      languages: 'Языки',
      preferredLanguages: 'Предпочтительные языки',
      occupation: 'Профессия / Учёба',
      university: 'Университет',
      cleanliness: 'Чистоплотность',
      sociability: 'Общительность',
      badHabits: 'Вредные привычки',
      smoking: 'Курение',
      alcohol: 'Алкоголь',
      pets: 'Питомцы',
      hasPet: 'Есть питомец',
      noPet: 'Нет питомца',
      guests: 'Гости',
      noiseLevel: 'Уровень шума',
      religion: 'Вероисповедание',
      quiet: 'Тихо',
      moderate: 'Умеренно',
      loud: 'Громко',
      yes: 'Да',
      no: 'Нет',
      never: 'Никогда',
      rarely: 'Редко',
      sometimes: 'Иногда',
      often: 'Часто',
      aboutYourself: 'О себе',
      idealRoommate: 'Идеальный сосед',
      quietHours: 'Тихие часы',
      next: 'Далее →',
      back: '← Назад',
      createBtn: 'Создать профиль 🎉',
      creating: 'Создание…',
      enterName: 'Введите имя',
      enterValidAge: 'Введите корректный возраст',
      selectGender: 'Выберите пол',
      selectRegion: 'Выберите регион',
      enterValidBudget: 'Введите корректный бюджет',
      selectSituation: 'Выберите ситуацию',
      enterAddress: 'Введите адрес жилья и выберите на карте',
    },

    home: {
      madeInKazakhstan: '🇰🇿 Сделано для Казахстана',
      heroTitle: 'Найдите своего',
      heroTitleItalic: 'идеального',
      heroTitleEnd: 'соседа по комнате',
      heroSubtitle: 'От Алматы до Астаны — общайтесь с проверенными соседями по квартире, подходящими по образу жизни.',
      viewProfiles: 'Посмотрите анкеты',
      stats: {
        users: 'Активных пользователей',
        cities: 'Городов по Казахстану',
        satisfaction: 'Удовлетворённость совпадений',
      },
      features: 'Преимущества',
      whyChoose: 'Почему выбирают Roomate.kz',
      featureList: [
        { icon: '🛡️', title: 'Проверка ИИН', desc: 'Каждый профиль проверен и верифицирован для вашей безопасности' },
        { icon: '🗺️', title: '17 городов', desc: 'От Алматы до Актау — охватываем весь Казахстан' },
        { icon: '💬', title: '3 языка', desc: 'Общайтесь на казахском, русском или английском' },
        { icon: '⚡', title: 'Быстрый подбор', desc: 'Найдите идеального соседа менее чем за неделю' },
        { icon: '✨', title: 'Совместимость', desc: 'Детальный анализ совместимости по 20+ критериям' },
      ],
      compatibleRoommates: 'Совместимые соседи',
      exploreProfiles: 'Исследуйте совместимые профили',
      compatibility: 'Совместимость',
      verified: '✓ Верифицирован',
      pending: ' На проверке',
      notVerified: '⚠️ Не верифицирован',
      notSpecified: 'Не указан',
      readyToFind: 'Готовы найти',
      yourPerson: 'идеального соседа?',
      ctaSubtitle: 'Присоединяйтесь к сообществу более 4 200 соседей по комнате, которые уже нашли идеальное совпадение на Roomate.kz',
      viewOnMap: 'Посмотрите профили на карте',
      freeMatches: 'Бесплатные совпадения · Проверенные профили',
      ctaAction: 'Создайте аккаунт бесплатно',
      noCreditCard: 'Оплата не требуется · Проверка в течение 24 часов',
    },

    footer: {
      description: 'Первый в Казахстане умный сервис по подбору соседей по комнате. Подбор по образу жизни во всех 17 городах, с проверкой ИИН для безопасности.',
      housing: 'Жильё',
      housingLinks: ['Поиск комнат', 'Сдать жильё', 'Проверка совместимости', 'Безопасная сделка'],
      locations: 'Локации',
      locationLinks: ['Алматы', 'Астана', 'Шымкент', 'Все города'],
      resources: 'Ресурс',
      resourceLinks: ['О проекте', 'Центр доверия', 'Полезные статьи', 'Поддержка'],
      copyright: '© 2026 Roomate.kz · Астана, Казахстан',
      privacy: 'Политика конфиденциальности · Условия использования',
    },

    dashboard: {
      browse: 'Обзор',
      swipe: 'Свайп',
      map: 'Карта',
      matches: 'Избранное',
      profile: 'Профиль',
      connected: '✓ Подключено',
      reconnecting: '⟳ Переподключение…',
    },

    browse: {
      searchPlaceholder: 'Поиск по имени…',
      filters: 'Фильтры',
      budget: 'Бюджет',
      gender: 'Пол',
      anyGender: 'Любой пол',
      gridView: 'Сетка',
      listView: 'Список',
      noProfiles: 'Профили не найдены',
      adjustFilters: 'Попробуйте изменить фильтры',
      compatibility: 'Совместимость',
      online: 'Онлайн',
      lookingForPlace: 'Ищет квартиру',
      lookingForRoommate: 'Ищет соседа',
      hasPlace: 'Есть квартира',
      perMonth: '/мес',
    },

    profile: {
      verified: '✓ Верифицирован',
      pending: ' На проверке',
      notVerified: '⚠️ Не верифицирован',
      addToFavourites: '🤍 В избранное',
      inFavourites: '❤️ В избранном',
      location: 'Локация',
      budget: 'Бюджет',
      occupation: 'Профессия',
      moveIn: 'Въезд',
      aboutMe: 'О себе',
      idealRoommate: 'Идеальный сосед',
      quietHours: 'Тихие часы',
      lifestyle: 'Образ жизни',
      cleanliness: 'Чистоплотность',
      sociability: 'Общительность',
      hasPet: ' Питомец',
      remote: ' Удалёнка',
      nonSmoker: ' Не курит',
      nonDrinker: ' Не пьёт',
      interests: 'Интересы',
      sendMessage: 'Написать сообщение',
      oneMessage: 'Одно сообщение — сделайте его запоминающимся ✨',
      messagePlaceholder: 'Привет, {name}! Увидел(а) твою анкету и…',
      send: 'Отправить',
      sending: 'Отправка…',
      messageSent: '✓ Сообщение отправлено!',
      messageSentSub: 'После ответа откроется чат ',
      matched: ' Совпадение!',
      matchedSub: '{name} хочет познакомиться',
      openChat: '💬 Перейти в чат',
      openFavouritesForChat: 'Откройте вкладку «Избранное» для переписки',
      perMonth: '/мес',
    },

    swipe: {
      heroTitle: 'Найдите своего',
      heroItalic: 'идеального',
      heroTitleEnd: 'соседа',
      subtitle: 'Свайп вправо — лайк, влево — пропустить',
      noMore: 'Больше анкет нет',
      noMoreSub: 'Вы просмотрели всех в вашем районе. Заходите позже!',
      matchScore: 'Совместимость',
      ofTotal: 'из',
      clickToView: ' Нажмите для просмотра',
      dragHint: ' Перетащите',
    },

    matches: {
      title: 'Избранное',
      subtitle: 'Ваши совпадения и понравившиеся профили',
      noMatches: 'Пока нет совпадений',
      noMatchesSub: 'Лайкайте профили, чтобы начать совпадения!',
      mutualMatch: 'Взаимное совпадение!',
      canChat: 'Можете общаться свободно',
      startChat: 'Начните общение',
      writeFirst: 'Напишите первое сообщение {name}!',
      today: 'Сегодня',
      typingPlaceholder: 'Написать сообщение…',
      likes: 'Понравилось',
      noLikes: 'Нет понравившихся профилей',
      noLikesSub: 'Просматривайте и лайкайте профили',
    },

    profileEdit: {
      title: 'Редактировать профиль',
      subtitle: 'Держите информацию актуальной',
      save: 'Сохранить профиль',
      saving: 'Сохранение…',
      saved: 'Сохранено!',
      verification: 'Верификация',
      verifyNow: 'Верифицировать сейчас',
      uploadDoc: ' Верификация профиля',
      uploadDocSub: 'Загрузите чёткое фото вашего паспорта или удостоверения личности (ИИН). Проверка проводится автоматически и занимает менее 24 часов.',
      chooseDoc: 'Выберите документ',
      clickOrDrop: 'Кликните или перетащите файл',
      fileTypes: 'JPG, PNG (макс 10 МБ)',
      docChosen: '✓ Документ выбран',
      preview: 'Предпросмотр',
      cancel: '✕ Отмена',
      submit: '✓ Отправить',
      uploading: '⏳ Загрузка…',
      selectDocFirst: 'Выберите документ',
      uploaded: '✓ Документ загружен! Проверка займёт менее 24 часов.',
      uploadError: 'Ошибка загрузки: ',
      photos: 'Фотографии профиля',
      mainPhoto: '+ Главное фото',
      photoN: '+ Фото {n}',
      uploading2: ' Загрузка…',
      photoTip: 'JPG, PNG · до 5 МБ · автосохранение',
      clickMapToPin: 'Кликните на карту, чтобы указать точное местоположение',
      geocoding: 'Определяю адрес…',
    },

    verifyBanner: {
      message: 'Загрузите документ для подтверждения личности и получите больше совпадений',
      cta: 'Верифицировать сейчас',
    },

    verifyNotif: {
      approved: '✓ Ваш профиль верифицирован!',
      rejected: '✗ Ваш профиль отклонён',
    },

    map: {
      drawAreas: 'Нарисовать зоны',
      clearAll: 'Очистить всё',
      freehand: 'Свободный',
      circle: 'Круг',
      profilesInArea: 'анкет в зоне',
      noProfilesInArea: 'Нет анкет в выделенной зоне',
      escToCancel: 'Нажмите Esc для отмены',
      drawingHint: 'Удерживайте и перемещайте для рисования',
    },

    admin: {
      title: ' Панель верификации',
      subtitle: 'Проверьте и верифицируйте профили',
      pending: ' На проверке',
      approved: '✓ Верифицированы',
      rejected: '✗ Отклонены',
      review: 'Проверить',
      details: ' Детали',
      noProfiles: 'Нет профилей',
      info: 'ℹ Информация',
      age: 'Возраст',
      gender: 'Пол',
      region: 'Регион',
      budget: 'Бюджет',
      uploadedDoc: ' Загруженный документ',
      rejectionReason: ' Причина отклонения',
      reasonPlaceholder: 'Причина…',
      currentStatus: 'Текущий статус',
      statusApproved: '✓ Верифицирован',
      statusRejected: '✗ Отклонён',
      statusPending: ' На проверке',
      reject: '✗ Отклонить',
      verify: '✓ Верифицировать',
    },

    common: {
      loading: 'Загрузка…',
      save: 'Сохранить',
      cancel: 'Отмена',
      close: 'Закрыть',
      confirm: 'Подтвердить',
      delete: 'Удалить',
      edit: 'Редактировать',
      back: 'Назад',
      next: 'Далее',
      yes: 'Да',
      no: 'Нет',
      error: 'Ошибка',
      success: 'Успех',
      online: 'Онлайн',
      perMonth: '/мес',
      notSpecified: 'Не указан',
    },
  },

  // ── Kazakh ───────────────────────────────────────────────────────────────────
  kk: {
    appName: 'Roomate.kz',
    tagline: 'Қазақстан үшін жасалған',

    nav: {
      map: 'Карта',
      likes: 'Ұнаттым',
      profile: 'Профиль',
      home: 'Басты бет',
      browse: 'Шолу',
      swipe: 'Свайп',
      matches: 'Таңдаулылар',
      admin: 'Әкімші',
      logout: '🚪 Шығу',
    },

    auth: {
      login: 'Кіру',
      register: 'Тіркелу',
      email: 'Email',
      password: 'Құпия сөз',
      rememberMe: 'Мені есте сақта',
      forgotPassword: 'Құпия сөзді ұмыттыңыз ба?',
      welcomeBack: 'Қайта оралдыңыз',
      signInMessage: 'Мінсіз көршіні табу үшін кіріңіз',
      newHere: 'Roomate.kz-ті пайдаланған жоқсыз ба?',
      joinCommunity: 'Қауымдастыққа қосылыңыз',
      alreadyHaveAccount: 'Аккаунтыңыз бар ма?',
      enterApp: 'Roomate.kz-ке кіру',
      loggingIn: 'Кіру…',
      resetPassword: 'Құпия сөзді қалпына келтіру',
      resetCode: 'Қалпына келтіру коды',
      newPassword: 'Жаңа құпия сөз',
      sendResetCode: 'Кодты жіберу',
      sending: 'Жіберілуде…',
      confirmReset: 'Растау',
      backToLogin: '← Кіруге оралу',
      enterEmail: 'Email енгізіңіз',
      invalidEmail: 'Дұрыс email енгізіңіз',
      enterPassword: 'Құпия сөз енгізіңіз',
      passwordRules: 'Құпия сөзде кемінде 8 таңба, бас әріп, кіші әріп, сан және арнайы таңба болуы керек',
      loginFailed: 'Аккаунтқа кіру мүмкін болмады',
      networkError: 'Желі қатесі: интернет байланысын тексеріңіз немесе сервер қолжетімді болмауы мүмкін. Қайтадан байқап көріңіз.',
      invalidCredentials: 'Қате email немесе құпия сөз',
      accountNotFound: 'Аккаунт табылмады. Тіркелуіңізді сұраймыз.',
    },

    register: {
      stepBasic: 'Негізгі ақпарат',
      stepBasicSub: 'Өзіңіз туралы айтыңыз',
      stepHousing: 'Тұрғын үй және жұмыс',
      stepLifestyle: 'Өмір салты',
      stepFinal: 'Соңғы қадам',
      createProfile: 'Профиль жасаңыз',
      findMatch: 'Мінсіз көршіңізді табайық',
      name: 'Толық аты',
      age: 'Жасы',
      gender: 'Жынысы',
      male: 'Ер',
      female: 'Әйел',
      region: 'Аймақ',
      budget: 'Бюджет (₸/ай)',
      yourSituation: 'Сіздің жағдайыңыз',
      lookingForPlace: 'Пәтер іздеймін',
      lookingForRoommate: 'Көрші іздеймін',
      havePlace: 'Пәтерім бар',
      wantRoommate: 'Көрші іздеймін',
      moveInDate: 'Кіру күні',
      remoteWork: 'Қашықтан жұмыс',
      schedule: 'Кесте',
      languages: 'Тілдер',
      preferredLanguages: 'Қалаулы тілдер',
      occupation: 'Мамандық / Оқу',
      university: 'Университет',
      cleanliness: 'Тазалық',
      sociability: 'Қарым-қатынастық',
      badHabits: 'Жаман әдеттер',
      smoking: 'Темекі шегу',
      alcohol: 'Алкоголь',
      pets: 'Үй жануарлары',
      hasPet: 'Үй жануары бар',
      noPet: 'Үй жануары жоқ',
      guests: 'Қонақтар',
      noiseLevel: 'Шу деңгейі',
      religion: 'Дін',
      quiet: 'Тыныш',
      moderate: 'Орташа',
      loud: 'Шулы',
      yes: 'Иә',
      no: 'Жоқ',
      never: 'Ешқашан',
      rarely: 'Сирек',
      sometimes: 'Кейде',
      often: 'Жиі',
      aboutYourself: 'Өзіңіз туралы',
      idealRoommate: 'Мінсіз көрші',
      quietHours: 'Тыныш сағаттар',
      next: 'Келесі →',
      back: '← Артқа',
      createBtn: 'Профиль жасау 🎉',
      creating: 'Жасалуда…',
      enterName: 'Атыңызды енгізіңіз',
      enterValidAge: 'Дұрыс жас енгізіңіз',
      selectGender: 'Жынысыңызды таңдаңыз',
      selectRegion: 'Аймақты таңдаңыз',
      enterValidBudget: 'Дұрыс бюджет енгізіңіз',
      selectSituation: 'Жағдайыңызды таңдаңыз',
      enterAddress: 'Мекенжайыңызды енгізіңіз және картадан таңдаңыз',
    },

    home: {
      madeInKazakhstan: '🇰🇿 Қазақстанда жасалған',
      heroTitle: 'Өзіңізге',
      heroTitleItalic: 'мінсіз',
      heroTitleEnd: 'бөлме серіктесін табыңыз',
      heroSubtitle: 'Алматыдан Астанаға дейін — өмір салтыңызға сәйкес тексерілген бөлме серіктерімен байланысыңыз.',
      viewProfiles: 'Профильдерді қараңыз',
      stats: {
        users: 'Белсенді пайдаланушылар',
        cities: 'Қазақстан қалалары',
        satisfaction: 'Сәйкестік қанағаттануы',
      },
      features: 'Артықшылықтар',
      whyChoose: 'Неге Roomate.kz таңдайды',
      featureList: [
        { icon: '🛡️', title: 'ЖСН тексеру', desc: 'Қауіпсіздігіңіз үшін әр профиль тексерілген' },
        { icon: '🗺️', title: '17 қала', desc: 'Алматыдан Ақтауға дейін — бүкіл Қазақстан' },
        { icon: '💬', title: '3 тіл', desc: 'Қазақша, орысша немесе ағылшынша сөйлесіңіз' },
        { icon: '⚡', title: 'Жылдам сәйкестік', desc: 'Бір аптадан аз уақытта мінсіз серікті табыңыз' },
        { icon: '✨', title: 'Үйлесімділік', desc: '20+ критерий бойынша егжей-тегжейлі талдау' },
      ],
      compatibleRoommates: 'Үйлесімді серіктер',
      exploreProfiles: 'Үйлесімді профильдерді зерттеңіз',
      compatibility: 'Үйлесімділік',
      verified: '✓ Расталған',
      pending: ' Тексерілуде',
      notVerified: ' Расталмаған',
      notSpecified: 'Көрсетілмеген',
      readyToFind: 'Табуға дайынсыз ба',
      yourPerson: 'мінсіз серігіңізді?',
      ctaSubtitle: 'Қазақстан бойынша үйлесімді бөлме серіктерін тапқан 4 200+ адамға қосылыңыз. Тіркелу тегін, мәңгілік.',
      viewOnMap: 'Картадағы профильдерді қараңыз',
      freeMatches: 'Тегін сәйкестіктер · Расталған профильдер',
      ctaAction: 'Тегін аккаунт жасаңыз',
      noCreditCard: 'Төлем қажет емес · 24 сағат ішінде тексеру',
    },

    footer: {
      description: 'Қазақстандағы алғашқы ақылды бөлме серігін табу сервисі. Барлық 17 қалада өмір салтына негізделген сәйкестік, ЖСН тексерумен қауіпсіздік.',
      housing: 'Тұрғын үй',
      housingLinks: ['Бөлме іздеу', 'Тұрғын үй жалдау', 'Үйлесімділікті тексеру', 'Қауіпсіз мәміле'],
      locations: 'Орындар',
      locationLinks: ['Алматы', 'Астана', 'Шымкент', 'Барлық қалалар'],
      resources: 'Ресурстар',
      resourceLinks: ['Біз туралы', 'Сенім орталығы', 'Мақалалар', 'Қолдау'],
      copyright: '© 2026 Roomate.kz · Астана, Қазақстан',
      privacy: 'Құпиялылық саясаты · Пайдалану шарттары',
    },

    dashboard: {
      browse: 'Шолу',
      swipe: 'Свайп',
      map: 'Карта',
      matches: 'Таңдаулылар',
      profile: 'Профиль',
      connected: '✓ Қосылды',
      reconnecting: '⟳ Қайта қосылуда…',
    },

    browse: {
      searchPlaceholder: 'Атымен іздеу…',
      filters: 'Сүзгілер',
      budget: 'Бюджет',
      gender: 'Жынысы',
      anyGender: 'Кез келген жыныс',
      gridView: 'Тор',
      listView: 'Тізім',
      noProfiles: 'Профильдер табылмады',
      adjustFilters: 'Сүзгілерді өзгертіп көріңіз',
      compatibility: 'Үйлесімділік',
      online: 'Онлайн',
      lookingForPlace: 'Пәтер іздеуде',
      lookingForRoommate: 'Көрші іздеуде',
      hasPlace: 'Пәтері бар',
      perMonth: '/ай',
    },

    profile: {
      verified: '✓ Расталған',
      pending: ' Тексерілуде',
      notVerified: ' Расталмаған',
      addToFavourites: '🤍 Таңдаулыларға',
      inFavourites: '❤️ Таңдаулыларда',
      location: 'Орналасқан жері',
      budget: 'Бюджет',
      occupation: 'Мамандық',
      moveIn: 'Кіру',
      aboutMe: 'Өзім туралы',
      idealRoommate: 'Мінсіз серік',
      quietHours: 'Тыныш сағаттар',
      lifestyle: 'Өмір салты',
      cleanliness: 'Тазалық',
      sociability: 'Қарым-қатынастық',
      hasPet: ' Үй жануары бар',
      remote: ' Қашықтан жұмыс',
      nonSmoker: ' Темекі шекпейді',
      nonDrinker: ' Алкоголь ішпейді',
      interests: 'Қызығушылықтар',
      sendMessage: 'Хабарлама жазу',
      oneMessage: 'Бір хабарлама — ұмытылмастай ету ✨',
      messagePlaceholder: 'Сәлем, {name}! Профиліңізді көрдім және…',
      send: 'Жіберу',
      sending: 'Жіберілуде…',
      messageSent: '✓ Хабарлама жіберілді!',
      messageSentSub: 'Жауап берсе, чат ашылады ',
      matched: ' Сәйкестік!',
      matchedSub: '{name} танысқысы келеді',
      openChat: ' Чатқа өту',
      openFavouritesForChat: 'Хат алмасу үшін «Таңдаулылар» қойындысын ашыңыз',
      perMonth: '/ай',
    },

    swipe: {
      heroTitle: 'Өзіңізге',
      heroItalic: 'мінсіз',
      heroTitleEnd: 'серікті табыңыз',
      subtitle: 'Оңға свайп — ұнату, солға — өткізіп жіберу',
      noMore: 'Профильдер қалмады',
      noMoreSub: 'Сіз аймағыңыздағы барлықты көрдіңіз. Кейін қайта кіріңіз!',
      matchScore: 'Үйлесімділік',
      ofTotal: '/',
      clickToView: ' Толық профильді қарау үшін картаны басыңыз',
      dragHint: ' Сүйреңіз немесе түймелерді қолданыңыз',
    },

    matches: {
      title: 'Таңдаулылар',
      subtitle: 'Сіздің сәйкестіктеріңіз және ұнатылған профильдер',
      noMatches: 'Сәйкестіктер жоқ',
      noMatchesSub: 'Сәйкестіктерді бастау үшін профильдерді ұнатыңыз!',
      mutualMatch: 'Өзара сәйкестік!',
      canChat: 'Еркін сөйлесе аласыз',
      startChat: 'Сөйлесуді бастаңыз',
      writeFirst: '{name}-ге бірінші хабарламаны жіберіңіз!',
      today: 'Бүгін',
      typingPlaceholder: 'Хабарлама жазыңыз…',
      likes: 'Ұнаттым',
      noLikes: 'Ұнатылған профильдер жоқ',
      noLikesSub: 'Профильдерді қарап, ұнатыңыз',
    },

    profileEdit: {
      title: 'Профильді өңдеу',
      subtitle: 'Ақпаратты жаңартып тұрыңыз',
      save: 'Профильді сақтау',
      saving: 'Сақталуда…',
      saved: 'Сақталды!',
      verification: 'Растау',
      verifyNow: 'Қазір растаңыз',
      uploadDoc: ' Профильді растау',
      uploadDocSub: 'Паспортыңыздың немесе жеке куәлігіңіздің (ЖСН) анық фотосын жүктеңіз. Тексеру 24 сағаттан аз уақытта жүреді.',
      chooseDoc: 'Құжатты таңдаңыз',
      clickOrDrop: 'Файлды басыңыз немесе сүйреңіз',
      fileTypes: 'JPG, PNG (макс 10 МБ)',
      docChosen: '✓ Құжат таңдалды',
      preview: 'Алдын ала қарау',
      cancel: '✕ Болдырмау',
      submit: '✓ Жіберу',
      uploading: '⏳ Жүктелуде…',
      selectDocFirst: 'Құжатты таңдаңыз',
      uploaded: '✓ Құжат жүктелді! Тексеру 24 сағаттан аз уақытта аяқталады.',
      uploadError: 'Жүктеу қатесі: ',
      photos: 'Профиль фотолары',
      mainPhoto: '+ Негізгі фото',
      photoN: '+ Фото {n}',
      uploading2: '⏳ Жүктелуде…',
      photoTip: 'JPG, PNG · 5 МБ дейін · автосақтау',
      clickMapToPin: 'Дәл орынды белгілеу үшін картаны басыңыз',
      geocoding: 'Мекенжай анықталуда…',
    },

    verifyBanner: {
      message: 'Жеке басыңызды растау үшін құжат жүктеңіз және көбірек сәйкестік алыңыз',
      cta: 'Қазір растаңыз',
    },

    verifyNotif: {
      approved: '✓ Профиліңіз расталды!',
      rejected: '✗ Профиліңіз қабылданбады',
    },

    map: {
      drawAreas: 'Аймақтарды сызу',
      clearAll: 'Барлығын тазалау',
      freehand: 'Еркін',
      circle: 'Шеңбер',
      profilesInArea: 'аймақтағы профильдер',
      noProfilesInArea: 'Таңдалған аймақта профильдер жоқ',
      escToCancel: 'Болдырмау үшін Esc басыңыз',
      drawingHint: 'Іздеу аймағын сызу үшін ұстап сүйреңіз',
    },

    admin: {
      title: '🔍 Растау панелі',
      subtitle: 'Профильдерді тексеріп, растаңыз',
      pending: '⏳ Тексерілуде',
      approved: '✓ Расталды',
      rejected: '✗ Қабылданбады',
      review: '🔍 Тексеру',
      details: '👁️ Мәліметтер',
      noProfiles: 'Профильдер жоқ',
      info: ' Ақпарат',
      age: 'Жасы',
      gender: 'Жынысы',
      region: 'Аймақ',
      budget: 'Бюджет',
      uploadedDoc: ' Жүктелген құжат',
      rejectionReason: ' Қабылдамау себебі',
      reasonPlaceholder: 'Себебі…',
      currentStatus: 'Ағымдағы күй',
      statusApproved: '✓ Расталған',
      statusRejected: '✗ Қабылданбаған',
      statusPending: ' Тексерілуде',
      reject: '✗ Қабылдамау',
      verify: '✓ Растау',
    },

    common: {
      loading: 'Жүктелуде…',
      save: 'Сақтау',
      cancel: 'Болдырмау',
      close: 'Жабу',
      confirm: 'Растау',
      delete: 'Жою',
      edit: 'Өңдеу',
      back: 'Артқа',
      next: 'Келесі',
      yes: 'Иә',
      no: 'Жоқ',
      error: 'Қате',
      success: 'Сәтті',
      online: 'Онлайн',
      perMonth: '/ай',
      notSpecified: 'Көрсетілмеген',
    },
  },
};



const LanguageContext = createContext(null);

/**
 * Wrap your app in <LanguageProvider> to enable useLanguage() everywhere.
 */
export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    const stored = localStorage.getItem(LANG_KEY);
    return stored && TRANSLATIONS[stored] ? stored : 'ru';
  });

  const setLang = useCallback((l) => {
    if (!TRANSLATIONS[l]) return;
    localStorage.setItem(LANG_KEY, l);
    setLangState(l);
  }, []);

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

/**
 * Hook: const { lang, setLang, t } = useLanguage();
 */
export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside <LanguageProvider>');

  const translate = useCallback(
    (key, vars = {}) => tWithLang(ctx.lang, key, vars),
    [ctx.lang]
  );

  return { lang: ctx.lang, setLang: ctx.setLang, t: translate };
}

// ─── Imperative helpers ───────────────────────────────────────────────────────

export function getCurrentLang() {
  const stored = localStorage.getItem(LANG_KEY);
  return stored && TRANSLATIONS[stored] ? stored : 'ru';
}

/**
 * Translate a dotted key path with optional variable substitution.
 * t('profile.perMonth')  →  '/мес'
 * t('profile.matchedSub', { name: 'Айгерим' })  →  'Айгерим хочет познакомиться'
 */
export function tWithLang(lang, key, vars = {}) {
  const dict = TRANSLATIONS[lang] || TRANSLATIONS['ru'];
  const parts = key.split('.');
  let val = dict;
  for (const p of parts) {
    if (val === undefined || val === null) break;
    val = val[p];
  }
  if (val === undefined || val === null) {
    // Fallback chain: try ru, then en
    let fb = TRANSLATIONS['ru'];
    for (const p of parts) {
      if (!fb) break;
      fb = fb[p];
    }
    val = fb ?? key; // last resort: show the key
  }
  if (typeof val !== 'string') return key;
  return val.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? vars[k] : `{${k}}`));
}

export function t(key, vars = {}) {
  return tWithLang(getCurrentLang(), key, vars);
}

// ─── Language Switcher Component ──────────────────────────────────────────────

const LANG_OPTIONS = [
  { code: 'en', label: 'EN', full: 'English' },
  { code: 'ru', label: 'RU', full: 'Русский' },
  { code: 'kk', label: 'ҚАЗ', full: 'Қазақша' },
];

/**
 * LanguageSwitcher — a pill-style toggle for EN / RU / KAZ
 *
 * Props:
 *   variant: 'pill' (default) | 'dropdown' | 'minimal'
 *   dark:    boolean  — light-on-dark vs dark-on-light
 */
export function LanguageSwitcher({ variant = 'pill', dark = false }) {
  const { lang, setLang } = useLanguage();

  const base = {
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
    background: dark ? 'rgba(255,255,255,0.10)' : 'rgba(28,43,30,0.06)',
    borderRadius: '100px',
    padding: '3px',
    border: dark ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(28,43,30,0.10)',
  };

  const btnBase = {
    border: 'none',
    cursor: 'pointer',
    borderRadius: '100px',
    padding: '5px 11px',
    fontFamily: "'Geologica', sans-serif",
    fontSize: '0.72rem',
    fontWeight: 600,
    letterSpacing: '0.5px',
    transition: 'all 0.2s ease',
  };

  const active = {
    background: dark ? 'rgba(255,255,255,0.95)' : '#7A9E7E',
    color: dark ? '#1C2B1E' : 'white',
    boxShadow: dark ? '0 2px 8px rgba(0,0,0,0.2)' : '0 2px 8px rgba(122,158,126,0.35)',
  };

  const inactive = {
    background: 'transparent',
    color: dark ? 'rgba(255,255,255,0.65)' : 'rgba(28,43,30,0.55)',
  };

  if (variant === 'dropdown') {
    return (
      <select
        value={lang}
        onChange={(e) => setLang(e.target.value)}
        style={{
          padding: '6px 10px',
          border: dark ? '1px solid rgba(255,255,255,0.2)' : '1px solid #C8DEC4',
          borderRadius: '8px',
          background: dark ? 'rgba(255,255,255,0.1)' : '#F2F8F1',
          color: dark ? 'white' : '#1C2B1E',
          fontFamily: "'Geologica', sans-serif",
          fontSize: '0.8rem',
          fontWeight: 600,
          cursor: 'pointer',
          outline: 'none',
        }}
      >
        {LANG_OPTIONS.map((o) => (
          <option key={o.code} value={o.code}>{o.label} — {o.full}</option>
        ))}
      </select>
    );
  }

  if (variant === 'minimal') {
    return (
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        {LANG_OPTIONS.map((o) => (
          <button
            key={o.code}
            onClick={() => setLang(o.code)}
            style={{
              ...btnBase,
              padding: '3px 6px',
              background: 'none',
              color: lang === o.code
                ? (dark ? 'white' : '#7A9E7E')
                : (dark ? 'rgba(255,255,255,0.4)' : 'rgba(28,43,30,0.4)'),
              fontWeight: lang === o.code ? 700 : 500,
              textDecoration: lang === o.code ? 'underline' : 'none',
              textUnderlineOffset: '3px',
            }}
          >
            {o.label}
          </button>
        ))}
      </div>
    );
  }

  // Default: pill
  return (
    <div style={base} title="Switch language">
      {LANG_OPTIONS.map((o) => (
        <button
          key={o.code}
          onClick={() => setLang(o.code)}
          style={{ ...btnBase, ...(lang === o.code ? active : inactive) }}
          title={o.full}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
