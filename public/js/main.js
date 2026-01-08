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

// --- 2. RENDER SINGLE PROJECT (For Project Detail Page) ---
// --- 2. RENDER SINGLE PROJECT (For Project Detail Page) ---
export async function renderProjectDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    
    if(!id) return; 

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

    // 2. Populate Header & Metadata
    document.getElementById('p-title').innerText = p.title;
    document.getElementById('p-status').innerText = (p.status || 'Draft').toUpperCase();
    document.getElementById('p-date').innerHTML = `<i class="fas fa-calendar"></i> Updated: ${new Date(p.updated_at).toLocaleDateString()}`;
    
    const imgEl = document.getElementById('p-image');
    if (p.thumbnail_url) {
        imgEl.style.backgroundImage = `url('${p.thumbnail_url}')`;
        imgEl.style.display = 'block';
    } else {
        imgEl.style.display = 'none';
    }

    // 3. Render Markdown Content
    const contentEl = document.getElementById('markdown-content');
    
    // Debugging check
    if (typeof marked === 'undefined') {
        console.error("❌ 'marked' library missing. Add script tag to project.html");
        contentEl.innerHTML = "<p class='text-red-500'>System Error: Markdown parser not loaded.</p>";
    } else if (p.content_md) {
        // Render content
        contentEl.innerHTML = marked.parse(p.content_md);
    } else {
        contentEl.innerHTML = '<p class="text-gray-500">No content details provided.</p>';
    }

    // 4. Tech Stack & Links
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

    // 5. Update Views (Backend Call)
    // We don't await this to speed up rendering, but we log errors
    supabase.rpc('increment_view', { row_id: id }).then(({ error }) => {
        if (error) console.error("Failed to increment view:", error);
        else console.log("View counted.");
    });

    // Display initial stats
    let currentViews = (p.views || 0) + 1; // +1 to reflect current visit
    let currentLikes = p.likes || 0;

    document.getElementById('p-views').innerHTML = `<i class="fas fa-eye text-space-light"></i> ${currentViews} Views`;
    
    const likeBtn = document.getElementById('p-likes');
    likeBtn.innerHTML = `<i class="fas fa-heart text-space-light"></i> ${currentLikes} Likes`;
    
    // 6. Interaction: Like Button
    likeBtn.onclick = async () => {
        if(likeBtn.classList.contains('liked')) return; // Block double clicks

        likeBtn.innerHTML = `<i class="fas fa-spinner fa-spin text-space-light"></i> Saving...`;
        
        const { error } = await supabase.rpc('increment_like', { row_id: id });

        if (error) {
            console.error("Like failed:", error);
            alert("Could not like: " + error.message);
            likeBtn.innerHTML = `<i class="fas fa-heart text-space-light"></i> ${currentLikes} Likes`; // Revert
        } else {
            currentLikes++;
            likeBtn.innerHTML = `<i class="fas fa-heart text-red-500"></i> ${currentLikes} Likes`;
            likeBtn.classList.add('liked');
            console.log("Like saved to DB!");
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
