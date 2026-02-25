// Mock data templates for different service forms

export const formTemplates = {
  // Legacy service types (kept for backward compatibility)
  deposit: {
    fields: [
      { id: 'accountNumber', label: 'Account Number', type: 'text', required: true },
      { id: 'amount', label: 'Amount', type: 'number', required: true },
      { id: 'depositorName', label: 'Depositor Name', type: 'text', required: true },
      { id: 'phoneNumber', label: 'Phone Number', type: 'tel', required: false }
    ]
  },
  withdrawal: {
    fields: [
      { id: 'accountNumber', label: 'Account Number', type: 'text', required: true },
      { id: 'amount', label: 'Amount', type: 'number', required: true },
      { id: 'purpose', label: 'Purpose', type: 'text', required: false }
    ]
  },
  accountOpening: {
    fields: [
      { id: 'fullName', label: 'Full Name', type: 'text', required: true },
      { id: 'fatherName', label: 'Father Name', type: 'text', required: true },
      { id: 'dateOfBirth', label: 'Date of Birth', type: 'text', required: true },
      { id: 'aadharNumber', label: 'Aadhar Number', type: 'text', required: true },
      { id: 'panNumber', label: 'PAN Number', type: 'text', required: true },
      { id: 'address', label: 'Address', type: 'text', required: true },
      { id: 'city', label: 'City', type: 'text', required: true },
      { id: 'pincode', label: 'Pincode', type: 'text', required: true },
      { id: 'phoneNumber', label: 'Phone Number', type: 'tel', required: true },
      { id: 'email', label: 'Email', type: 'email', required: false }
    ]
  },
  addressUpdate: {
    fields: [
      { id: 'accountNumber', label: 'Account Number', type: 'text', required: true },
      { id: 'newAddress', label: 'New Address', type: 'text', required: true },
      { id: 'city', label: 'City', type: 'text', required: true },
      { id: 'pincode', label: 'Pincode', type: 'text', required: true },
      { id: 'proofType', label: 'Address Proof Type', type: 'text', required: true }
    ]
  },
  
  // New form categories
  accountOpeningForms: {
    fields: [
      { id: 'accountType', label: 'Account Type', type: 'text', required: true },
      { id: 'fullName', label: 'Full Name', type: 'text', required: true },
      { id: 'fatherName', label: 'Father/Spouse Name', type: 'text', required: true },
      { id: 'dateOfBirth', label: 'Date of Birth', type: 'text', required: true },
      { id: 'aadharNumber', label: 'Aadhar Number', type: 'text', required: true },
      { id: 'panNumber', label: 'PAN Number', type: 'text', required: true },
      { id: 'address', label: 'Residential Address', type: 'text', required: true },
      { id: 'phoneNumber', label: 'Mobile Number', type: 'tel', required: true },
      { id: 'email', label: 'Email Address', type: 'email', required: false },
      { id: 'initialDeposit', label: 'Initial Deposit Amount', type: 'number', required: true }
    ]
  },
  
  transactionForms: {
    fields: [
      { id: 'transactionType', label: 'Transaction Type', type: 'text', required: true },
      { id: 'accountNumber', label: 'Account Number', type: 'text', required: true },
      { id: 'amount', label: 'Amount', type: 'number', required: true },
      { id: 'depositorName', label: 'Name', type: 'text', required: true },
      { id: 'phoneNumber', label: 'Phone Number', type: 'tel', required: false }
    ]
  },
  
  loanApplicationForms: {
    fields: [
      { id: 'loanType', label: 'Loan Type', type: 'text', required: true },
      { id: 'loanAmount', label: 'Loan Amount Required', type: 'number', required: true },
      { id: 'fullName', label: 'Full Name', type: 'text', required: true },
      { id: 'monthlyIncome', label: 'Monthly Income', type: 'number', required: true },
      { id: 'employmentType', label: 'Employment Type', type: 'text', required: true },
      { id: 'panNumber', label: 'PAN Number', type: 'text', required: true },
      { id: 'aadharNumber', label: 'Aadhar Number', type: 'text', required: true },
      { id: 'phoneNumber', label: 'Contact Number', type: 'tel', required: true }
    ]
  },
  
  kycForms: {
    fields: [
      { id: 'accountNumber', label: 'Account Number', type: 'text', required: true },
      { id: 'fullName', label: 'Full Name', type: 'text', required: true },
      { id: 'aadharNumber', label: 'Aadhar Number', type: 'text', required: true },
      { id: 'panNumber', label: 'PAN Number', type: 'text', required: true },
      { id: 'currentAddress', label: 'Current Address', type: 'text', required: true },
      { id: 'phoneNumber', label: 'Mobile Number', type: 'tel', required: true },
      { id: 'email', label: 'Email', type: 'email', required: false }
    ]
  },
  
  serviceRequestForms: {
    fields: [
      { id: 'accountNumber', label: 'Account Number', type: 'text', required: true },
      { id: 'serviceType', label: 'Service Requested', type: 'text', required: true },
      { id: 'fullName', label: 'Account Holder Name', type: 'text', required: true },
      { id: 'phoneNumber', label: 'Mobile Number', type: 'tel', required: true },
      { id: 'additionalDetails', label: 'Additional Details', type: 'text', required: false }
    ]
  },
  
  transferRemittanceForms: {
    fields: [
      { id: 'transferType', label: 'Transfer Type', type: 'text', required: true },
      { id: 'fromAccount', label: 'From Account Number', type: 'text', required: true },
      { id: 'beneficiaryName', label: 'Beneficiary Name', type: 'text', required: true },
      { id: 'beneficiaryAccount', label: 'Beneficiary Account', type: 'text', required: true },
      { id: 'ifscCode', label: 'IFSC Code', type: 'text', required: true },
      { id: 'amount', label: 'Transfer Amount', type: 'number', required: true },
      { id: 'purpose', label: 'Purpose', type: 'text', required: false }
    ]
  },
  
  investmentWealthForms: {
    fields: [
      { id: 'investmentType', label: 'Investment Type', type: 'text', required: true },
      { id: 'accountNumber', label: 'Account Number', type: 'text', required: true },
      { id: 'fullName', label: 'Full Name', type: 'text', required: true },
      { id: 'panNumber', label: 'PAN Number', type: 'text', required: true },
      { id: 'investmentAmount', label: 'Investment Amount', type: 'number', required: true },
      { id: 'phoneNumber', label: 'Contact Number', type: 'tel', required: true }
    ]
  },
  
  enquiryDisputeForms: {
    fields: [
      { id: 'accountNumber', label: 'Account Number', type: 'text', required: true },
      { id: 'enquiryType', label: 'Enquiry/Dispute Type', type: 'text', required: true },
      { id: 'fullName', label: 'Full Name', type: 'text', required: true },
      { id: 'description', label: 'Description', type: 'text', required: true },
      { id: 'phoneNumber', label: 'Contact Number', type: 'tel', required: true }
    ]
  },
  
  closureNominationForms: {
    fields: [
      { id: 'requestType', label: 'Request Type', type: 'text', required: true },
      { id: 'accountNumber', label: 'Account Number', type: 'text', required: true },
      { id: 'accountHolderName', label: 'Account Holder Name', type: 'text', required: true },
      { id: 'nomineeDetails', label: 'Nominee/Reason Details', type: 'text', required: true },
      { id: 'phoneNumber', label: 'Contact Number', type: 'tel', required: true }
    ]
  }
};

export const translations = {
  en: {
    welcome: 'Welcome to SAHAYAK Bank Kiosk',
    touchToStart: 'Touch to Start',
    selectLanguage: 'Select Your Language',
    staffAuthentication: 'Staff Authentication',
    staffLoginTitle: 'Bank Staff Login',
    staffLoginMessage: 'Please enter your staff PIN to access the kiosk',
    staffPinLabel: 'Staff PIN',
    enterStaffPin: 'Enter Staff PIN (4 digits)',
    invalidPin: 'Invalid PIN. Please try again.',
    loginSuccess: 'Login Successful',
    authentication: 'Authentication',
    enterAccountNumber: 'Enter Account Number',
    enterPin: 'Enter 4-Digit PIN',
    accountNumber: 'Account Number',
    pin: 'PIN',
    useKeypad: 'Use the keypad below to enter your details',
    clear: 'Clear',
    confirm: 'Confirm',
    back: 'Back',
    otpVerification: 'OTP Verification',
    enterOtp: 'Enter OTP',
    otpSentTo: 'OTP has been sent to your registered mobile number',
    timeRemaining: 'Time Remaining',
    seconds: 'seconds',
    resendOtp: 'Resend OTP',
    verifying: 'Verifying...',
    success: 'Success!',
    authenticationSuccess: 'Authentication Successful',
    welcome_user: 'Welcome',
    thankYou: 'Thank you for using SAHAYAK Kiosk',
    selectMode: 'Select How You Want to Continue',
    voiceMode: 'Voice + IVR',
    voiceModeDesc: 'Recommended for easy guided input',
    touchMode: 'Touch Only',
    touchModeDesc: 'Use keypad and on-screen controls',
    assistedMode: 'Assisted Mode',
    assistedModeDesc: 'A staff member will help you',
    selectService: 'Select Form Category',
    deposit: 'Deposit',
    withdrawal: 'Withdrawal',
    accountOpening: 'Account Opening',
    addressUpdate: 'Address Update',
    
    // New form categories
    accountOpeningForms: 'Account Opening Forms',
    accountOpeningFormsDesc: 'Documents for setting up new savings, current, or fixed deposit accounts.',
    transactionForms: 'Transaction Forms (Deposit / Withdraw)',
    transactionFormsDesc: 'Slips used for depositing cash/cheques or withdrawing funds from an account.',
    loanApplicationForms: 'Loan Application Forms',
    loanApplicationFormsDesc: 'Detailed forms for requesting personal, home, vehicle, or business loans.',
    kycForms: 'KYC (Know Your Customer) Forms',
    kycFormsDesc: 'Documents used for periodic identity and address verification.',
    serviceRequestForms: 'Service Request Forms',
    serviceRequestFormsDesc: 'Requests for new cheque books, ATM cards, or updating contact details.',
    transferRemittanceForms: 'Transfer & Remittance Forms',
    transferRemittanceFormsDesc: 'Instructions for domestic or international wire transfers (RTGS/NEFT).',
    investmentWealthForms: 'Investment & Wealth Management',
    investmentWealthFormsDesc: 'Forms for mutual funds, insurance, or stock trading accounts.',
    enquiryDisputeForms: 'Enquiry & Dispute Forms',
    enquiryDisputeFormsDesc: 'Documents used to lodge complaints or request specific account history details.',
    closureNominationForms: 'Closure & Nomination Forms',
    closureNominationFormsDesc: 'Final documents to close an account or update beneficiary/nominee information.',
    
    listening: 'Listening... Please speak clearly',
    speakNow: 'Speak Now',
    reRecord: 'Repeat',
    proceed: 'Proceed',
    preview: 'Form Preview',
    edit: 'Edit',
    voiceConfirmTitle: 'Voice Confirmation',
    confirmIfCorrect: 'Press Confirm if all details are correct',
    editIfChange: 'Press Edit to make changes',
    confirmDetailsTitle: 'Please Confirm',
    confirmDetailsInfo: 'Please verify this information is correct before proceeding',
    proceedToVerification: 'Proceed to Verification',
    waitingStaff: 'Waiting for bank staff approval',
    staffVerificationTitle: 'Waiting for Bank Staff Approval',
    staffPinPrompt: 'Bank Staff: Please Enter Your 4-Digit PIN',
    formApproved: 'Form Approved',
    printing: 'Printing your acknowledgement...',
    collectFromStaff: 'Please collect your printed form from the bank staff',
    autoResetNotice: 'Returning to home screen in a few seconds...',
    yourNameIs: 'Your name is',
    amountIs: 'Amount is',
    pressToConfirm: 'Press 1 to confirm.',
    rupees: 'rupees',
    amountInWords5000: 'five thousand rupees',
    amountInWordsFallback: 'the entered amount'
  },
  hi: {
    welcome: 'सहायक बैंक कियोस्क में आपका स्वागत है',
    touchToStart: 'शुरू करने के लिए स्पर्श करें',
    selectLanguage: 'अपनी भाषा चुनें',
    staffAuthentication: 'स्टाफ प्रमाणीकरण',
    staffLoginTitle: 'बैंक स्टाफ लॉगिन',
    staffLoginMessage: 'कियोस्क तक पहुँचने के लिए कृपया अपना स्टाफ पिन दर्ज करें',
    staffPinLabel: 'स्टाफ पिन',
    enterStaffPin: 'स्टाफ पिन दर्ज करें (4 अंक)',
    invalidPin: 'अमान्य पिन। कृपया पुनः प्रयास करें।',
    loginSuccess: 'लॉगिन सफल',
    authentication: 'प्रमाणीकरण',
    enterAccountNumber: 'खाता संख्या दर्ज करें',
    enterPin: '4-अंकों का पिन दर्ज करें',
    accountNumber: 'खाता संख्या',
    pin: 'पिन',
    useKeypad: 'अपना विवरण दर्ज करने के लिए नीचे दिए गए कीपैड का उपयोग करें',
    clear: 'साफ़ करें',
    confirm: 'पुष्टि करें',
    back: 'वापस',
    otpVerification: 'ओटीपी सत्यापन',
    enterOtp: 'ओटीपी दर्ज करें',
    otpSentTo: 'ओटीपी आपके पंजीकृत मोबाइल नंबर पर भेजा गया है',
    timeRemaining: 'शेष समय',
    seconds: 'सेकंड',
    resendOtp: 'ओटीपी पुनः भेजें',
    verifying: 'सत्यापित कर रहे हैं...',
    success: 'सफलता!',
    authenticationSuccess: 'प्रमाणीकरण सफल',
    welcome_user: 'स्वागत है',
    thankYou: 'सहायक कियोस्क का उपयोग करने के लिए धन्यवाद',
    selectMode: 'जारी रखने का तरीका चुनें',
    voiceMode: 'वॉयस + IVR',
    voiceModeDesc: 'आसान मार्गदर्शित इनपुट के लिए',
    touchMode: 'केवल टच',
    touchModeDesc: 'कीपैड और ऑन-स्क्रीन नियंत्रण',
    assistedMode: 'सहायता मोड',
    assistedModeDesc: 'स्टाफ आपकी मदद करेगा',
    selectService: 'सेवा चुनें',
    deposit: 'जमा',
    withdrawal: 'निकासी',
    accountOpening: 'खाता खोलना',
    addressUpdate: 'पता अपडेट',
    
    // New form categories
    accountOpeningForms: 'खाता खोलने के फॉर्म',
    accountOpeningFormsDesc: 'नए बचत, चालू या सावधि जमा खाते खोलने के लिए दस्तावेज़',
    transactionForms: 'लेनदेन फॉर्म (जमा / निकासी)',
    transactionFormsDesc: 'नकद/चेक जमा करने या खाते से धन निकालने के लिए उपयोग की जाने वाली पर्ची',
    loanApplicationForms: 'ऋण आवेदन फॉर्म',
    loanApplicationFormsDesc: 'व्यक्तिगत, गृह, वाहन या व्यावसायिक ऋण के लिए विस्तृत आवेदन फॉर्म',
    kycForms: 'केवाईसी (अपने ग्राहक को जानें) फॉर्म',
    kycFormsDesc: 'नियमित पहचान और पते के सत्यापन के लिए उपयोग किए जाने वाले दस्तावेज़',
    serviceRequestForms: 'सेवा अनुरोध फॉर्म',
    serviceRequestFormsDesc: 'नई चेक बुक, एटीएम कार्ड या संपर्क विवरण अपडेट करने के लिए अनुरोध',
    transferRemittanceForms: 'स्थानांतरण और प्रेषण फॉर्म',
    transferRemittanceFormsDesc: 'घरेलू या अंतर्राष्ट्रीय वायर ट्रांसफर के लिए निर्देश (RTGS/NEFT)',
    investmentWealthForms: 'निवेश और धन प्रबंधन',
    investmentWealthFormsDesc: 'म्यूचुअल फंड, बीमा या स्टॉक ट्रेडिंग खातों के लिए फॉर्म',
    enquiryDisputeForms: 'पूछताछ और विवाद फॉर्म',
    enquiryDisputeFormsDesc: 'शिकायत दर्ज करने या विशिष्ट खाता इतिहास विवरण का अनुरोध करने के लिए दस्तावेज़',
    closureNominationForms: 'बंद करना और नामांकन फॉर्म',
    closureNominationFormsDesc: 'खाता बंद करने या लाभार्थी/नामिती जानकारी अपडेट करने के लिए अंतिम दस्तावेज़',
    
    listening: 'सुन रहे हैं... कृपया स्पष्ट बोलें',
    speakNow: 'अब बोलें',
    reRecord: 'दोहराएँ',
    proceed: 'आगे बढ़ें',
    preview: 'फॉर्म पूर्वावलोकन',
    edit: 'संपादन',
    voiceConfirmTitle: 'वॉयस पुष्टि',
    confirmIfCorrect: 'यदि विवरण सही हैं तो पुष्टि दबाएँ',
    editIfChange: 'बदलाव के लिए संपादन दबाएँ',
    confirmDetailsTitle: 'कृपया पुष्टि करें',
    confirmDetailsInfo: 'कृपया आगे बढ़ने से पहले जानकारी की पुष्टि करें',
    proceedToVerification: 'सत्यापन के लिए आगे बढ़ें',
    waitingStaff: 'बैंक स्टाफ की मंजूरी की प्रतीक्षा',
    staffVerificationTitle: 'बैंक स्टाफ की मंजूरी की प्रतीक्षा',
    staffPinPrompt: 'बैंक स्टाफ: अपना 4-अंकों का पिन दर्ज करें',
    formApproved: 'फॉर्म स्वीकृत',
    printing: 'आपकी पावती प्रिंट हो रही है...',
    collectFromStaff: 'कृपया मुद्रित फॉर्म बैंक स्टाफ से प्राप्त करें',
    autoResetNotice: 'कुछ सेकंड में होम स्क्रीन पर लौट रहे हैं...',
    yourNameIs: 'आपका नाम है',
    amountIs: 'राशि है',
    pressToConfirm: 'पुष्टि के लिए 1 दबाएँ।',
    rupees: 'रुपये',
    amountInWords5000: 'पाँच हजार रुपये',
    amountInWordsFallback: 'दर्ज की गई राशि'
  },
  ta: {
    welcome: 'சஹாயக் வங்கி கியோஸ்க்கில் வரவேற்கிறோம்',
    touchToStart: 'தொடங்க தொடவும்',
    selectLanguage: 'உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்',
    staffAuthentication: 'பணியாளர் அங்கீகாரம்',
    staffLoginTitle: 'வங்கி பணியாளர் உள்நுழைவு',
    staffLoginMessage: 'கியோஸ்க்கை அணுக உங்கள் பணியாளர் PIN ஐ உள்ளிடவும்',
    staffPinLabel: 'பணியாளர் PIN',
    enterStaffPin: 'பணியாளர் PIN உள்ளிடவும் (4 இலக்கங்கள்)',
    invalidPin: 'தவறான PIN. மீண்டும் முயற்சிக்கவும்.',
    loginSuccess: 'உள்நுழைவு வெற்றிகரமானது',
    authentication: 'அங்கீகாரம்',
    enterAccountNumber: 'கணக்கு எண்ணை உள்ளிடவும்',
    enterPin: '4-இலக்க பின் உள்ளிடவும்',
    accountNumber: 'கணக்கு எண்',
    pin: 'பின்',
    useKeypad: 'உங்கள் விவரங்களை உள்ளிட கீழே உள்ள விசைப்பலகையைப் பயன்படுத்தவும்',
    clear: 'அழி',
    confirm: 'உறுதிப்படுத்து',
    back: 'பின்செல்',
    otpVerification: 'ஓடிபி சரிபார்ப்பு',
    enterOtp: 'ஓடிபியை உள்ளிடவும்',
    otpSentTo: 'ஓடிபி உங்கள் பதிவு செய்யப்பட்ட மொபைல் எண்ணிற்கு அனுப்பப்பட்டுள்ளது',
    timeRemaining: 'மீதமுள்ள நேரம்',
    seconds: 'விநாடிகள்',
    resendOtp: 'ஓடிபியை மீண்டும் அனுப்பு',
    verifying: 'சரிபார்க்கிறது...',
    success: 'வெற்றி!',
    authenticationSuccess: 'அங்கீகாரம் வெற்றிகரமாக',
    welcome_user: 'வரவேற்கிறோம்',
    thankYou: 'சஹாயக் கியோஸ்க்கைப் பயன்படுத்தியதற்கு நன்றி',
    selectMode: 'தொடர விரும்பும் முறையைத் தேர்ந்தெடுக்கவும்',
    voiceMode: 'வாய் + IVR',
    voiceModeDesc: 'எளிதான வழிகாட்டிய உள்ளீடு',
    touchMode: 'தொடு மட்டும்',
    touchModeDesc: 'விசைப்பலகை மற்றும் திரை கட்டுப்பாடுகள்',
    assistedMode: 'உதவி முறை',
    assistedModeDesc: 'ஸ்டாப் உதவி செய்வார்',
    selectService: 'சேவையைத் தேர்ந்தெடுக்கவும்',
    deposit: 'செலுத்தல்',
    withdrawal: 'பணமெடுப்பு',
    accountOpening: 'கணக்கு திறப்பு',
    addressUpdate: 'முகவரி புதுப்பிப்பு',
    
    // New form categories
    accountOpeningForms: 'கணக்கு திறப்பு படிவங்கள்',
    accountOpeningFormsDesc: 'புதிய சேமிப்பு, நடப்பு அல்லது நிலையான வைப்பு கணக்குகளை அமைப்பதற்கான ஆவணங்கள்',
    transactionForms: 'பரிவர்த்தனை படிவங்கள் (செலுத்தல் / எடுத்தல்)',
    transactionFormsDesc: 'பணம்/காசோலைகளை செலுத்த அல்லது கணக்கிலிருந்து பணம் எடுக்க பயன்படுத்தப்படும் சீட்டுகள்',
    loanApplicationForms: 'கடன் விண்ணப்ப படிவங்கள்',
    loanApplicationFormsDesc: 'தனிப்பட்ட, வீடு, வாகனம் அல்லது வணிக கடன்களுக்கான விரிவான படிவங்கள்',
    kycForms: 'கேஒய்சி (உங்கள் வாடிக்கையாளரை அறியுங்கள்) படிவங்கள்',
    kycFormsDesc: 'அவ்வப்போது அடையாள மற்றும் முகவரி சரிபார்ப்புக்காக பயன்படுத்தப்படும் ஆவணங்கள்',
    serviceRequestForms: 'சேவை கோரிக்கை படிவங்கள்',
    serviceRequestFormsDesc: 'புதிய காசோலை புத்தகங்கள், ஏடிஎம் கார்டுகள் அல்லது தொடர்பு விவரங்களை புதுப்பிப்பதற்கான கோரிக்கைகள்',
    transferRemittanceForms: 'பரிமாற்றம் & பணம் அனுப்பல் படிவங்கள்',
    transferRemittanceFormsDesc: 'உள்நாட்டு அல்லது சர்வதேச வயர் பரிமாற்றங்களுக்கான வழிமுறைகள் (RTGS/NEFT)',
    investmentWealthForms: 'முதலீடு & செல்வ மேலாண்மை',
    investmentWealthFormsDesc: 'பரஸ்பர நிதிகள், காப்பீடு அல்லது பங்கு வர்த்தக கணக்குகளுக்கான படிவங்கள்',
    enquiryDisputeForms: 'விசாரணை & சர்ச்சை படிவங்கள்',
    enquiryDisputeFormsDesc: 'புகார்களை பதிவு செய்ய அல்லது குறிப்பிட்ட கணக்கு வரலாறு விவரங்களை கோருவதற்கான ஆவணங்கள்',
    closureNominationForms: 'மூடல் & பரிந்துரை படிவங்கள்',
    closureNominationFormsDesc: 'கணக்கை மூட அல்லது பயனாளி/பரிந்துரைக்கப்பட்ட தகவலை புதுப்பிக்க இறுதி ஆவணங்கள்',
    
    listening: 'கேட்கிறோம்... தெளிவாக பேசவும்',
    speakNow: 'இப்போது பேசுங்கள்',
    reRecord: 'மீண்டும் பதிவு',
    proceed: 'தொடரவும்',
    preview: 'படிவ முன்னோட்டம்',
    edit: 'திருத்தம்',
    voiceConfirmTitle: 'குரல் உறுதிப்படுத்தல்',
    confirmIfCorrect: 'விவரங்கள் சரியாக இருந்தால் உறுதிப்படுத்தவும்',
    editIfChange: 'மாற்ற வேண்டுமெனில் திருத்தம் அழுத்தவும்',
    confirmDetailsTitle: 'தயவுசெய்து உறுதிப்படுத்தவும்',
    confirmDetailsInfo: 'தொடர்வதற்கு முன் தகவலை சரிபார்க்கவும்',
    proceedToVerification: 'சரிபார்ப்பிற்கு தொடரவும்',
    waitingStaff: 'வங்கி பணியாளர் அனுமதி காத்திருக்கிறது',
    staffVerificationTitle: 'வங்கி பணியாளர் அனுமதி காத்திருக்கிறது',
    staffPinPrompt: 'வங்கி பணியாளர்: 4 இலக்க PIN உள்ளிடவும்',
    formApproved: 'படிவம் ஒப்புதல் பெற்றது',
    printing: 'உங்கள் அங்கீகாரம் அச்சிடப்படுகிறது...',
    collectFromStaff: 'அச்சிடப்பட்ட படிவத்தை வங்கி பணியாளரிடம் பெறவும்',
    autoResetNotice: 'சில விநாடிகளில் முகப்பு திரைக்கு திரும்புகிறது...',
    yourNameIs: 'உங்கள் பெயர்',
    amountIs: 'தொகை',
    pressToConfirm: 'உறுதிப்படுத்த 1 அழுத்தவும்.',
    rupees: 'ரூபாய்',
    amountInWords5000: 'ஐந்தாயிரம் ரூபாய்',
    amountInWordsFallback: 'உள்ளிடப்பட்ட தொகை'
  }
};
