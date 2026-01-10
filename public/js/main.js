import { supabase } from './supabase.js';

// --- 1. RENDER PROJECT GRID (For Projects Page & Home Page) ---
export async function renderProjectGrid(containerId, limit = null) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.warn(`Container #${containerId} not found in HTML.`);
        return;
    }

    container.innerHTML = '';

    // Build Query
    let query = supabase
        .from('projects')
        .select('*')
        .eq('status', 'published') // ⚠️ IMPORTANT: Only shows "Published" projects
        .order('created_at', { ascending: false });

    if (limit) {
        query = query.limit(limit);
    }

    const { data: projects, error } = await query;

    // Debugging: Check console to see what we got
    console.log(`Fetching for #${containerId}:`, projects);

    if (error) {
        console.error("Supabase Error:", error);
        container.innerHTML = `<p class="text-red-500">Failed to load projects. check console.</p>`;
        return;
    }

    if (!projects || projects.length === 0) {
        container.innerHTML = `<p class="text-gray-500 italic col-span-full text-center">No projects published yet. Go to Admin and set status to 'Published'.</p>`;
        return;
    }

    // Render Cards
    // Render Cards
    container.innerHTML = projects.map(p => {
        const imageUrl = p.thumbnail_url || 'https://via.placeholder.com/800x400/004d48/ffffff?text=No+Image';
        const desc = p.description || 'No description provided.';
        const tags = p.tags || [];

        // Added 'w-full max-w-[350px]' below to ensure consistent sizing in flex layout
        return `
        <a href="/project?id=${p.id}" class="glass-card w-full max-w-[350px] rounded-xl overflow-hidden flex flex-col h-full hover:no-underline group transition-all duration-300 hover:border-space-light/50">
            <!-- Image -->
            <div class="h-48 bg-gray-900 bg-cover bg-center relative overflow-hidden">
                 <div class="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110" 
                      style="background-image: url('${imageUrl}');">
                 </div>
            </div>
            <!-- ... rest of content ... -->

            <!-- Content -->
            <div class="p-6 flex-grow relative z-10 bg-[#050b14]/90 backdrop-blur-sm">
                <div class="flex justify-between items-start mb-2">
                    <h3 class="font-bold text-white text-xl leading-tight group-hover:text-space-light transition-colors">${p.title}</h3>
                </div>
                
                <p class="text-gray-400 text-sm mb-4 line-clamp-2 h-10">${desc}</p>
                
                <!-- Tags -->
                <div class="flex flex-wrap gap-2 mt-auto">
                    ${tags.slice(0, 3).map(t => 
                        `<span class="text-[10px] border border-white/10 bg-white/5 px-2 py-0.5 rounded text-space-light font-mono">${t}</span>`
                    ).join('')}
                </div>
            </div>

            <!-- Stats Footer -->
            <div class="px-6 py-4 border-t border-white/5 bg-black/40 flex justify-between text-xs font-mono text-gray-500 group-hover:text-space-light transition-colors">
                <span><i class="fas fa-eye mr-1"></i> ${p.views || 0}</span>
                <span><i class="fas fa-heart mr-1"></i> ${p.likes || 0}</span>
            </div>
        </a>
        `;
    }).join('');
}

// --- HELPER: RENDER PROGRESS STEPPER ---
function renderProgressBar(currentPhase) {
    const phases = ['Concept', 'Design', 'Manufacturing', 'Building', 'Refining', 'Complete'];
    const container = document.getElementById('progress-stepper');
    if (!container) return;

    let currentIndex = phases.indexOf(currentPhase);
    if (currentIndex === -1) currentIndex = 0; // Default to start

    // Calculate percentage for the connecting line
    const progressPercent = (currentIndex / (phases.length - 1)) * 100;

    let html = `
        <div class="relative flex justify-between items-center w-full mb-8">
            <!-- Background Line -->
            <div class="absolute top-1/2 left-0 w-full h-1 bg-gray-800 -z-10 rounded"></div>
            <!-- Active Progress Line -->
            <div class="absolute top-1/2 left-0 h-1 bg-space-light -z-10 rounded transition-all duration-1000" style="width: ${progressPercent}%;"></div>
    `;

    html += phases.map((phase, index) => {
        let circleClass = "bg-gray-800 border-gray-600 text-gray-500"; // Default (Future)
        let textClass = "text-gray-600";
        let glow = "";

        if (index < currentIndex) {
            // Completed
            circleClass = "bg-space-dark border-space-light text-space-light"; 
            textClass = "text-space-light";
        } else if (index === currentIndex) {
            // Active
            circleClass = "bg-black border-space-light text-space-light shadow-[0_0_15px_#3ff3e7]";
            textClass = "text-white font-bold";
            glow = `<div class="absolute inset-0 bg-space-light rounded-full animate-ping opacity-20"></div>`;
        }

        return `
            <div class="flex flex-col items-center relative group cursor-default">
                <div class="w-8 h-8 rounded-full border-2 flex items-center justify-center text-[10px] font-bold z-10 transition-all ${circleClass}">
                    ${glow}
                    ${index < currentIndex ? '<i class="fas fa-check"></i>' : index + 1}
                </div>
                <div class="absolute top-10 text-[10px] uppercase tracking-wider ${textClass} opacity-0 group-hover:opacity-100 md:opacity-100 transition-opacity whitespace-nowrap">
                    ${phase}
                </div>
            </div>
        `;
    }).join('');

    html += `</div>`;
    container.innerHTML = html;
}

// --- 2. RENDER SINGLE PROJECT (For Project Detail Page) ---
// --- UPDATED RENDER SINGLE PROJECT ---
export async function renderProjectDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    
    if(!id) return; // Stop if no ID

    // 1. Fetch Project Data
    const { data: p, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !p) {
        console.error("Error loading project:", error);
        document.getElementById('project-content').innerHTML = "<h1 class='text-white text-center mt-20'>Project Not Found.</h1>";
        return;
    }

    // 2. Populate Header Info
    document.getElementById('p-title').innerText = p.title;
    document.getElementById('p-status').innerText = (p.status || 'Draft').toUpperCase();

    // --- FIX 1: THUMBNAIL VISIBILITY ---
    const imgEl = document.getElementById('p-image');
    if (p.thumbnail_url) {
        imgEl.style.backgroundImage = `url('${p.thumbnail_url}')`;
        // We must specifically remove the Tailwind 'hidden' class
        imgEl.classList.remove('hidden'); 
    } else {
        imgEl.classList.add('hidden');
    }

    // --- FIX 2: UPDATED DATE ---
    const dateRaw = p.updated_at || p.created_at; // Fallback to created_at if updated is missing
    let readableDate = "Unknown";
    
    if (dateRaw) {
        // Formats to: "Oct 24, 2023"
        readableDate = new Date(dateRaw).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    }
    document.getElementById('p-date').innerHTML = `<i class="fas fa-calendar mr-2"></i> Updated: ${readableDate}`;

    // 3. Render Progress Bar
    // Ensure this helper function exists in your main.js (from previous steps)
    if (typeof renderProgressBar === 'function') {
        renderProgressBar(p.project_phase || 'Concept');
    }

    // 4. Content Tabs Logic
    const contentEl = document.getElementById('markdown-content');
    const tabMain = document.getElementById('tab-main');
    const tabLearn = document.getElementById('tab-learn');

    const mdMain = p.content_md || 'No content provided.';
    const mdLearn = p.learnings_md || 'No learnings added yet.';

    // Default View
    if (typeof marked !== 'undefined') {
        contentEl.innerHTML = marked.parse(mdMain);
    }

    // Tab Handlers
    window.switchProjectTab = (tab) => {
        if(tab === 'main') {
            contentEl.innerHTML = marked.parse(mdMain);
            tabMain.classList.add('text-space-light', 'border-space-light');
            tabMain.classList.remove('text-gray-500', 'border-transparent');
            
            tabLearn.classList.remove('text-space-light', 'border-space-light');
            tabLearn.classList.add('text-gray-500', 'border-transparent');
        } else {
            contentEl.innerHTML = marked.parse(mdLearn);
            tabLearn.classList.add('text-space-light', 'border-space-light');
            tabLearn.classList.remove('text-gray-500', 'border-transparent');
            
            tabMain.classList.remove('text-space-light', 'border-space-light');
            tabMain.classList.add('text-gray-500', 'border-transparent');
        }
    };

    // 5. Tech Stack & Links
    const stackContainer = document.getElementById('p-stack');
    const tags = p.tags || [];
    stackContainer.innerHTML = tags.length ? tags.map(s => 
        `<span class="px-2 py-1 bg-white/10 rounded text-xs text-space-light border border-space-light/20">${s}</span>`
    ).join('') : '<span class="text-gray-500 text-xs">No tags</span>';

    const linksContainer = document.getElementById('links-container');
    linksContainer.innerHTML = ''; 
    const links = p.links || {};
    
    if (links.demo) linksContainer.innerHTML += `<a href="${links.demo}" target="_blank" class="block w-full py-3 bg-space-light text-black font-bold text-center rounded hover:shadow-[0_0_15px_#3ff3e7] transition-all mb-3">Live Demo <i class="fas fa-external-link-alt ml-2"></i></a>`;
    if (links.github) linksContainer.innerHTML += `<a href="${links.github}" target="_blank" class="block w-full py-3 bg-gray-800 text-white font-bold text-center rounded hover:bg-gray-700 transition-all border border-gray-600">GitHub Repo <i class="fab fa-github ml-2"></i></a>`;

    // 6. Stats (Views/Likes)
    await supabase.rpc('increment_view', { row_id: id });
    
    document.getElementById('p-views').innerHTML = `<i class="fas fa-eye text-space-light"></i> ${p.views + 1} Views`;
    
    const likeBtn = document.getElementById('p-likes');
    let currentLikes = p.likes || 0;
    likeBtn.innerHTML = `<i class="fas fa-heart text-space-light"></i> ${currentLikes} Likes`;
    
    likeBtn.onclick = async () => {
        if(likeBtn.classList.contains('liked')) return;
        
        const { error } = await supabase.rpc('increment_like', { row_id: id });
        if (!error) {
            currentLikes++;
            likeBtn.innerHTML = `<i class="fas fa-heart text-red-500"></i> ${currentLikes} Likes`;
            likeBtn.classList.add('liked');
        }
    };
}

// --- CURSOR TRAIL LOGIC ---
document.addEventListener('mousemove', function(e) {
    // 1. Throttle: Only create a particle 40% of the time to keep it performant
    if (Math.random() > 0.4) return;

    // 2. Create the particle element
    const particle = document.createElement('div');
    particle.classList.add('cursor-trail');
    
    // 3. Position it at the mouse coordinates
    particle.style.left = e.clientX + 'px';
    particle.style.top = e.clientY + 'px';
    
    // 4. Randomize size slightly for a natural "dust" look
    const size = Math.random() * 4 + 2; // Random size between 2px and 6px
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;

    // 5. Add to body
    document.body.appendChild(particle);

    // 6. Cleanup: Remove element after animation finishes (0.8s)
    setTimeout(() => {
        particle.remove();
    }, 800);
});

