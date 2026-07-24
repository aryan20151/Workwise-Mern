const mongoose = require('mongoose');
const { connectDB } = require('./config/database');
const Requisition = require('./models/Requisition');
const Company = require('./models/Company');

const sampleRequisitions = [
    {
        requisitionId: 'REQ-2026-001',
        title: 'Senior MERN Stack Engineer',
        companyId: 'GOOG001',
        companyName: 'Google',
        industry: 'Technology',
        location: 'Mountain View, CA (Remote Available)',
        jobType: 'Full-Time',
        budget: '$140,000 - $180,000 / year',
        techStack: ['MongoDB', 'Express.js', 'React', 'Node.js', 'TypeScript', 'Redux'],
        description: 'We are seeking an experienced Senior MERN Stack Engineer to lead full-stack development of internal enterprise portals and client-facing cloud management dashboards. Responsibilities include designing RESTful APIs, optimizing MongoDB queries, building responsive React frontends, and driving code quality standards.',
        status: 'Open'
    },
    {
        requisitionId: 'REQ-2026-002',
        title: 'Frontend React Architect',
        companyId: 'META001',
        companyName: 'Meta (Facebook)',
        industry: 'Social Media',
        location: 'Menlo Park, CA (Hybrid)',
        jobType: 'Full-Time',
        budget: '$160,000 - $210,000 / year',
        techStack: ['React', 'Next.js', 'TailwindCSS', 'GraphQL', 'Jest', 'Webpack'],
        description: 'Join Meta Web Infrastructure team! You will define front-end architectural guidelines, optimize initial page loading metrics, migrate legacy component libraries to Next.js 14, and collaborate with product designers on smooth UI micro-interactions.',
        status: 'Open'
    },
    {
        requisitionId: 'REQ-2026-003',
        title: 'Backend Node.js & Microservices Lead',
        companyId: 'AMZN001',
        companyName: 'Amazon',
        industry: 'E-commerce & Cloud Computing',
        location: 'Seattle, WA',
        jobType: 'Full-Time',
        budget: '$150,000 - $195,000 / year',
        techStack: ['Node.js', 'Express.js', 'AWS', 'Docker', 'Kubernetes', 'PostgreSQL', 'Redis'],
        description: 'Lead a team of backend developers building high-throughput microservices for Amazon AWS Cloud ecosystem. You will architect resilient REST and gRPC API services, implement distributed Redis caching, and ensure zero-downtime deployments via Kubernetes.',
        status: 'Open'
    },
    {
        requisitionId: 'REQ-2026-004',
        title: 'AI/ML Systems & Backend Engineer',
        companyId: 'NVDA001',
        companyName: 'Nvidia',
        industry: 'Graphics & AI Technology',
        location: 'Santa Clara, CA',
        jobType: 'Full-Time',
        budget: '$170,000 - $230,000 / year',
        techStack: ['Python', 'PyTorch', 'CUDA', 'TensorFlow', 'FastAPI', 'C++'],
        description: 'Build backend pipelines and model serve endpoints for AI/ML inference acceleration. Work closely with GPU hardware engineers to serve deep learning models efficiently over high-concurrency FastAPI microservices.',
        status: 'Open'
    },
    {
        requisitionId: 'REQ-2026-005',
        title: 'Full Stack Next.js & TypeScript Engineer',
        companyId: 'MSFT001',
        companyName: 'Microsoft',
        industry: 'Software and Technology',
        location: 'Redmond, WA (Remote)',
        jobType: 'Full-Time',
        budget: '$135,000 - $175,000 / year',
        techStack: ['Next.js', 'React', 'TypeScript', 'Azure', 'TailwindCSS', 'Prisma'],
        description: 'Drive the development of developer-facing web portals and cloud services management hubs. You will use Next.js App Router, React Server Components, TypeScript type safety, and Azure Cloud functions.',
        status: 'Open'
    },
    {
        requisitionId: 'REQ-2026-006',
        title: 'DevOps & Cloud Infrastructure Specialist',
        companyId: 'ORCL001',
        companyName: 'Oracle',
        industry: 'Software and Technology',
        location: 'Austin, TX',
        jobType: 'Full-Time',
        budget: '$130,000 - $170,000 / year',
        techStack: ['Terraform', 'Kubernetes', 'Docker', 'AWS', 'CI/CD', 'Prometheus', 'Grafana'],
        description: 'Establish automated infrastructure-as-code deployments using Terraform, manage multi-region Kubernetes clusters, and monitor service reliability with Prometheus & Grafana alerting systems.',
        status: 'Open'
    },
    {
        requisitionId: 'REQ-2026-007',
        title: 'Mobile App Developer (React Native)',
        companyId: 'AAPL001',
        companyName: 'Apple',
        industry: 'Consumer Electronics',
        location: 'Cupertino, CA',
        jobType: 'Full-Time',
        budget: '$145,000 - $190,000 / year',
        techStack: ['React Native', 'Swift', 'TypeScript', 'Redux Toolkit', 'iOS', 'Android'],
        description: 'Construct native-feeling mobile applications for iOS and Android platforms. Work with native Swift modules, implement offline sync mechanisms, and deliver polished user experiences.',
        status: 'Open'
    },
    {
        requisitionId: 'REQ-2026-008',
        title: 'UI/UX Designer & Design Systems Lead',
        companyId: 'ADBE001',
        companyName: 'Adobe',
        industry: 'Software Development',
        location: 'San Jose, CA (Remote)',
        jobType: 'Full-Time',
        budget: '$120,000 - $160,000 / year',
        techStack: ['Figma', 'React', 'CSS3', 'Design Systems', 'HTML5', 'Storybook'],
        description: 'Design and implement scalable component libraries and design tokens across Adobe web products. Build interactive prototypes, conduct accessibility (a11y) audits, and publish Storybook documentation.',
        status: 'Open'
    },
    {
        requisitionId: 'REQ-2026-009',
        title: 'Cloud Solutions Architect - Enterprise CRM',
        companyId: 'CRM001',
        companyName: 'Salesforce',
        industry: 'Cloud Computing & CRM',
        location: 'San Francisco, CA',
        jobType: 'Full-Time',
        budget: '$165,000 - $220,000 / year',
        techStack: ['Salesforce CRM', 'Node.js', 'Python', 'GraphQL', 'REST APIs', 'AWS'],
        description: 'Design complex enterprise software architecture for multi-tenant CRM installations. Partner with high-value enterprise accounts to integrate legacy databases with modern cloud APIs.',
        status: 'Open'
    },
    {
        requisitionId: 'REQ-2026-010',
        title: 'Data Engineer & Big Data Pipeline Developer',
        companyId: 'IBM001',
        companyName: 'IBM',
        industry: 'IT Services',
        location: 'New York, NY (Hybrid)',
        jobType: 'Full-Time',
        budget: '$130,000 - $170,000 / year',
        techStack: ['Python', 'Apache Spark', 'SQL', 'Snowflake', 'Airflow', 'Kafka'],
        description: 'Build real-time stream processing pipelines using Kafka and Apache Spark. Clean, transform, and structure raw client telemetry into high-performance Snowflake analytics warehouses.',
        status: 'Open'
    },
    {
        requisitionId: 'REQ-2026-011',
        title: 'Cybersecurity & Application Security Specialist',
        companyId: 'CSCO001',
        companyName: 'Cisco',
        industry: 'Networking Equipment',
        location: 'San Jose, CA',
        jobType: 'Full-Time',
        budget: '$155,000 - $200,000 / year',
        techStack: ['Python', 'OAuth2', 'OWASP', 'Penetration Testing', 'Go', 'Network Security'],
        description: 'Protect web applications against OWASP top 10 security threats. Perform security reviews, implement JWT/OAuth2 authentication standards, and automate vulnerability scanning scripts.',
        status: 'Open'
    },
    {
        requisitionId: 'REQ-2026-012',
        title: 'Senior Golang Backend Developer',
        companyId: 'INTC001',
        companyName: 'Intel',
        industry: 'Semiconductors',
        location: 'Santa Clara, CA (Hybrid)',
        jobType: 'Full-Time',
        budget: '$140,000 - $185,000 / year',
        techStack: ['Go', 'gRPC', 'Protobuf', 'Docker', 'PostgreSQL', 'Linux'],
        description: 'Construct concurrent backend microservices in Golang for silicon telemetry and hardware control management interfaces. High focus on low-latency memory management and raw throughput.',
        status: 'Open'
    },
    {
        requisitionId: 'REQ-2026-013',
        title: 'QA Automation Lead & SDET',
        companyId: 'AVGO001',
        companyName: 'Broadcom',
        industry: 'Semiconductors & Infrastructure',
        location: 'San Jose, CA (Remote)',
        jobType: 'Full-Time',
        budget: '$115,000 - $150,000 / year',
        techStack: ['Cypress', 'Playwright', 'Jest', 'JavaScript', 'Selenium', 'CI/CD'],
        description: 'Lead automated end-to-end testing efforts across all company web portals. Write robust Playwright and Cypress test suites, integrate test suites into GitHub Actions, and reduce manual test cycles.',
        status: 'Open'
    },
    {
        requisitionId: 'REQ-2026-014',
        title: 'Full Stack Python & Django Developer',
        companyId: 'TSLA001',
        companyName: 'Tesla',
        industry: 'Automobile',
        location: 'Austin, TX',
        jobType: 'Full-Time',
        budget: '$135,000 - $175,000 / year',
        techStack: ['Python', 'Django', 'React', 'PostgreSQL', 'Redis', 'Docker'],
        description: 'Build real-time factory operations monitoring web apps and charging network dashboards using Python Django backend and React web clients.',
        status: 'Open'
    },
    {
        requisitionId: 'REQ-2026-015',
        title: 'Site Reliability Engineer (SRE)',
        companyId: 'GOOG001',
        companyName: 'Google',
        industry: 'Technology',
        location: 'Sunnyvale, CA',
        jobType: 'Full-Time',
        budget: '$150,000 - $195,000 / year',
        techStack: ['Kubernetes', 'Go', 'Python', 'Prometheus', 'GCP', 'Terraform'],
        description: 'Oversee high availability and system health for web application services. Automate incident remediation pipelines, execute load tests, and optimize cloud runtime costs.',
        status: 'Open'
    },
    {
        requisitionId: 'REQ-2026-016',
        title: 'React & Redux Toolkit Frontend Developer',
        companyId: 'MSFT001',
        companyName: 'Microsoft',
        industry: 'Software and Technology',
        location: 'Seattle, WA (Remote)',
        jobType: 'Full-Time',
        budget: '$125,000 - $160,000 / year',
        techStack: ['React', 'Redux Toolkit', 'TypeScript', 'CSS Modules', 'Jest'],
        description: 'Focus on crafting responsive user interfaces with complex local & global state management for Microsoft web management tools using React and Redux Toolkit.',
        status: 'Open'
    },
    {
        requisitionId: 'REQ-2026-017',
        title: 'Full Stack Developer - MERN & GraphQL',
        companyId: 'META001',
        companyName: 'Meta (Facebook)',
        industry: 'Social Media',
        location: 'New York, NY',
        jobType: 'Full-Time',
        budget: '$145,000 - $185,000 / year',
        techStack: ['MongoDB', 'Express.js', 'React', 'Node.js', 'GraphQL', 'Apollo'],
        description: 'Engineers needed to work on real-time activity feeds, dynamic notification hubs, and low-latency social interaction microservices using GraphQL and MERN stack.',
        status: 'Open'
    },
    {
        requisitionId: 'REQ-2026-018',
        title: 'Data Scientist - Machine Learning Analytics',
        companyId: 'AMZN001',
        companyName: 'Amazon',
        industry: 'E-commerce & Cloud Computing',
        location: 'Arlington, VA (Hybrid)',
        jobType: 'Full-Time',
        budget: '$140,000 - $180,000 / year',
        techStack: ['Python', 'Pandas', 'Scikit-Learn', 'SQL', 'Tableau', 'AWS SageMaker'],
        description: 'Build predictive machine learning models to analyze consumer purchasing trends, optimize product recommendations, and boost search relevance across e-commerce verticals.',
        status: 'Open'
    },
    {
        requisitionId: 'REQ-2026-019',
        title: 'Junior Web Developer (MERN Stack)',
        companyId: 'HPQ001',
        companyName: 'HP Inc.',
        industry: 'Computer Hardware',
        location: 'Palo Alto, CA (Hybrid)',
        jobType: 'Full-Time',
        budget: '$90,000 - $120,000 / year',
        techStack: ['JavaScript', 'React', 'Node.js', 'Express.js', 'MongoDB', 'CSS3'],
        description: 'Great growth opportunity for early-career full-stack developers. Assist in maintaining customer portal web applications, user registration flows, and device support lookup tools.',
        status: 'Open'
    },
    {
        requisitionId: 'REQ-2026-020',
        title: 'Principal Web Systems Architect',
        companyId: 'ADBE001',
        companyName: 'Adobe',
        industry: 'Software Development',
        location: 'San Francisco, CA',
        jobType: 'Full-Time',
        budget: '$185,000 - $240,000 / year',
        techStack: ['React', 'WebAssembly', 'Node.js', 'TypeScript', 'WebGL', 'Micro-frontends'],
        description: 'Define next-generation web system architecture for browser-based creative tools. Push the boundaries of WebAssembly, WebGL hardware acceleration, and client-side canvas performance.',
        status: 'Open'
    }
];

async function seedRequisitions() {
    try {
        console.log('🚀 Connecting to MongoDB Atlas...');
        await connectDB();

        console.log('🔍 Checking existing companies in database...');
        const dbCompanies = await Company.find({}).lean();
        const companyMap = {};
        dbCompanies.forEach(c => {
            if (c.companyId) companyMap[c.companyId] = c.name;
            if (c.name) companyMap[c.name.toLowerCase()] = c.companyId;
        });

        console.log(`📊 Found ${dbCompanies.length} companies in DB.`);

        let insertedCount = 0;
        let updatedCount = 0;

        for (const reqData of sampleRequisitions) {
            // Find company matching ID or Name if available in DB
            const existingComp = dbCompanies.find(c => c.companyId === reqData.companyId || c.name === reqData.companyName);
            if (existingComp) {
                reqData.companyId = existingComp.companyId;
                reqData.companyName = existingComp.name;
                reqData.industry = existingComp.industry || reqData.industry;
            }

            const result = await Requisition.findOneAndUpdate(
                { requisitionId: reqData.requisitionId },
                { $set: reqData },
                { upsert: true, new: true, runValidators: true }
            );

            if (result) {
                insertedCount++;
            }
        }

        console.log(`✅ Successfully seeded/updated ${insertedCount} job requisitions!`);
        
        const totalReqs = await Requisition.countDocuments();
        console.log(`📌 Total job requisitions currently in DB: ${totalReqs}`);

        const sampleList = await Requisition.find({}).limit(5);
        console.log('\n📋 Sample Job Requisitions in DB:');
        sampleList.forEach((r, idx) => {
            console.log(`${idx + 1}. [${r.requisitionId}] ${r.title} @ ${r.companyName} (${r.location}) - Budget: ${r.budget}`);
        });

        await mongoose.connection.close();
        console.log('\n👋 Connection closed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error seeding requisitions:', err);
        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
        }
        process.exit(1);
    }
}

seedRequisitions();
