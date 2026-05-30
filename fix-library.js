const fs = require("fs");
const content = fs.readFileSync("src/components/Library.tsx", "utf-8");

const startIdx = content.indexOf("return (");
const endIdx = content.lastIndexOf("function ObjectMenuButton");

if (startIdx === -1 || endIdx === -1) {
  console.error("Could not find bounds");
  process.exit(1);
}

const before = content.slice(0, startIdx);
const after = content.slice(endIdx);

const newReturn = `  return (
    <div className="page-enter fixed inset-0 flex bg-[#F2F2F7] text-gray-900 font-sans">
      <aside className="w-[280px] shrink-0 border-r border-gray-200 bg-[#F2F2F7] flex flex-col pt-12 pb-6">
        <h1 className="px-8 mb-6 text-[26px] font-bold tracking-tight text-gray-900">
          Goodnotes
        </h1>
        
        <nav className="flex-1 px-4 space-y-1">
          <button
            type="button"
            onClick={() => setActiveFolderId(null)}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-[15px] font-medium transition-colors bg-[#E3EFFF] text-[#0066CC]"
          >
            <FolderIcon size={20} className="fill-[#0066CC]" strokeWidth={1.5} />
            Documents
          </button>
          
          <button type="button" className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-[15px] font-medium text-gray-700 hover:bg-black/5 transition-colors">
            <span className="flex items-center justify-center w-5">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
            </span>
            Favorites
          </button>
          
          <button type="button" className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-[15px] font-medium text-gray-700 hover:bg-black/5 transition-colors">
            <Search size={20} strokeWidth={2} />
            Search
          </button>
          
          <button type="button" className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-[15px] font-medium text-gray-700 hover:bg-black/5 transition-colors">
            <User size={20} strokeWidth={2} />
            Shared
          </button>
          
          <button type="button" className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-[15px] font-medium text-gray-700 hover:bg-black/5 transition-colors">
            <BookOpen size={20} strokeWidth={2} />
            Marketplace
          </button>
        </nav>
      </aside>

      <main className="flex-1 flex flex-col bg-white rounded-tl-[16px] shadow-sm relative z-10 overflow-hidden">
        <header className="shrink-0 px-8 pt-10 pb-4">
          <div className="flex items-end justify-between">
            <div className="flex items-center gap-2">
              {activeFolderId && (
                <>
                  <button onClick={() => setActiveFolderId(null)} className="text-gray-500 hover:text-gray-900 text-3xl font-bold">
                    Documents
                  </button>
                  <ChevronRight size={24} className="text-gray-400 mx-2" />
                </>
              )}
              <h2 className="text-[32px] font-bold tracking-tight text-gray-900 leading-none">
                {activeFolderId ? activeFolder?.name : "Documents"}
              </h2>
            </div>
            
            <div className="flex items-center gap-6">
              {/* Filter Pills */}
              <div className="flex items-center bg-gray-100 rounded-full p-1 text-[13px] font-medium">
                <button className="px-4 py-1.5 rounded-full bg-white shadow-sm text-gray-900">Date</button>
                <button className="px-4 py-1.5 rounded-full text-gray-500 hover:text-gray-900">Name</button>
                <button className="px-4 py-1.5 rounded-full text-gray-500 hover:text-gray-900">Type</button>
              </div>
              
              <div className="flex items-center gap-4 text-[#0066CC]">
                <button className="hover:opacity-70 transition-opacity">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                </button>
                <button className="hover:opacity-70 transition-opacity">
                  <LayoutGrid size={24} strokeWidth={1.5} />
                </button>
              </div>
            </div>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto px-8 py-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-8 gap-y-10 pb-20">
            {/* New Button */}
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={openNotebookDialog}
                className="w-full aspect-[3/4] rounded-[8px] border-[2px] border-dashed border-[#0066CC]/40 flex items-center justify-center hover:bg-[#0066CC]/5 transition-colors mb-3"
              >
                <Plus size={32} className="text-[#0066CC]" strokeWidth={1.5} />
              </button>
              <span className="text-[14px] font-medium text-[#0066CC]">New...</span>
            </div>

            {/* Folders */}
            {filteredFolders.map((folder) => (
              <div key={folder.id} className="relative flex flex-col items-center group">
                <button
                  type="button"
                  data-folder-drop={folder.id}
                  onPointerDown={(e) => startPress({ id: folder.id, type: "folder" }, e)}
                  onClick={() => {
                    if (shouldIgnoreTap()) return;
                    setActiveFolderId(folder.id);
                  }}
                  className={cn(
                    "w-full aspect-[4/3] relative rounded-t-xl rounded-br-xl mb-3 transition-transform active:scale-[0.98]",
                    dropFolderId === folder.id && "ring-2 ring-blue-500 opacity-80",
                    dragTarget?.type === "folder" && dragTarget.id === folder.id && "opacity-45"
                  )}
                >
                  {/* Folder Tab SVG */}
                  <svg className="absolute -top-[14%] left-0 w-1/2 h-[30%]" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path d="M0 100 C 0 0, 0 0, 15 0 L 70 0 C 85 0, 100 0, 100 100 Z" fill={folder.color} />
                  </svg>
                  <div className="absolute inset-0 rounded-b-xl rounded-tr-xl shadow-sm" style={{ backgroundColor: folder.color }}>
                    <div className="absolute top-3 right-3 text-white/50">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                    </div>
                  </div>
                </button>
                <div className="flex items-center gap-1 text-[#0066CC]">
                  <span className="text-[14px] font-medium truncate max-w-[120px]">{folder.name}</span>
                  <ChevronRight size={14} className="rotate-90" />
                </div>
                <span className="text-[11px] text-gray-400 mt-0.5">
                  19 Jul 2023 at 18:51
                </span>
                
                <ObjectMenuButton subtle label="Menu" onClick={() => setMenuTarget({ id: folder.id, type: "folder" })} />
                {menuTarget?.type === "folder" && menuTarget.id === folder.id && (
                  <FolderMenu
                    folder={folder}
                    folders={folders ?? []}
                    onEdit={() => { openFolderDialog(folder); setMenuTarget(null); }}
                    onMove={(id) => handleMoveFolder(folder, id)}
                    onDelete={() => handleDeleteFolder(folder)}
                  />
                )}
              </div>
            ))}

            {/* Notebooks */}
            {filteredNotebooks.map((notebook) => (
              <div key={notebook.id} className="relative flex flex-col items-center group">
                <button
                  type="button"
                  onPointerDown={(e) => startPress({ id: notebook.id, type: "notebook" }, e)}
                  onClick={() => {
                    if (shouldIgnoreTap()) return;
                    openNotebook(notebook.id);
                  }}
                  className={cn(
                    "w-[90%] aspect-[3/4] relative rounded-r-[12px] rounded-l-[4px] shadow-[2px_4px_12px_rgba(0,0,0,0.1)] mb-3 transition-transform active:scale-[0.98]",
                    dragTarget?.type === "notebook" && dragTarget.id === notebook.id && "opacity-45"
                  )}
                  style={{ backgroundColor: notebook.color || "#A3D1E6" }}
                >
                  <div className="absolute left-0 top-0 bottom-0 w-4 bg-black/5 border-r border-black/10 rounded-l-[4px]"></div>
                  <div className="absolute top-2 right-2 text-white/50">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                  </div>
                </button>
                <div className="flex items-center gap-1 text-[#0066CC]">
                  <span className="text-[14px] font-medium truncate max-w-[120px]">{notebook.name}</span>
                  <ChevronRight size={14} className="rotate-90" />
                </div>
                <span className="text-[11px] text-gray-400 mt-0.5">
                  {new Date(notebook.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} at {new Date(notebook.updatedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                </span>

                <ObjectMenuButton subtle label="Menu" onClick={() => setMenuTarget({ id: notebook.id, type: "notebook" })} />
                {menuTarget?.type === "notebook" && menuTarget.id === notebook.id && (
                  <NotebookMenu
                    folders={folders ?? []}
                    onRename={() => { openNotebookRenameDialog(notebook.id, notebook.name); setMenuTarget(null); }}
                    onMove={(id) => handleMoveNotebook(notebook.id, id)}
                    onDelete={() => handleDeleteNotebook(notebook.id)}
                  />
                )}
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Drag Target & Dialogs (unchanged functionality, adapted styling) */}
      {dragTarget && (
        <div
          className="pointer-events-none fixed z-[70] flex -translate-x-1/2 -translate-y-1/2 items-center gap-3 rounded-xl border border-gray-200 bg-white/90 px-4 py-3 text-sm font-semibold text-gray-900 shadow-2xl backdrop-blur-xl"
          style={{ left: dragPoint.x, top: dragPoint.y }}
        >
          {dragTarget.type === "folder" ? <FolderIcon size={18} className="text-blue-500" /> : <BookOpen size={18} className="text-blue-500" />}
          <span className="max-w-[180px] truncate">
            {dragTarget.type === "folder"
              ? folders?.find((f) => f.id === dragTarget.id)?.name
              : notebooks?.find((n) => n.id === dragTarget.id)?.name}
          </span>
        </div>
      )}

      {dialogMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-5">
          <button type="button" aria-label="Close" className="absolute inset-0 bg-black/20" onClick={closeDialog} />
          <div role="dialog" className="relative w-full max-w-[380px] rounded-[16px] bg-[#F2F2F7] p-6 shadow-2xl">
            <h3 className="mb-4 text-xl font-bold tracking-tight text-center text-gray-900">
              {dialogMode === "folder" ? (editingFolderId ? "Edit Folder" : "New Folder") : (dialogMode === "rename-notebook" ? "Rename Notebook" : "New Notebook")}
            </h3>

            <div className="bg-white rounded-xl overflow-hidden shadow-sm">
              <input
                ref={inputRef}
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmitDialog()}
                placeholder={dialogMode === "folder" ? "Folder Name" : "Notebook Name"}
                className="w-full px-4 py-3 text-[17px] outline-none text-gray-900 placeholder:text-gray-400"
              />
            </div>

            {dialogMode === "folder" && (
              <div className="mt-6">
                <p className="mb-2 text-[13px] font-semibold text-gray-500 uppercase tracking-wide">Color</p>
                <div className="flex flex-wrap gap-3">
                  {FOLDER_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setDraftColor(color)}
                      className={cn("w-10 h-10 rounded-full transition-all border border-black/5 shadow-sm", draftColor === color ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-[#F2F2F7]" : "")}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            )}

            {dialogMode !== "rename-notebook" && dialogMode !== "folder" && (
               <div className="mt-6">
                 <p className="mb-2 text-[13px] font-semibold text-gray-500 uppercase tracking-wide">Color</p>
                 <div className="flex flex-wrap gap-3">
                   {NOTEBOOK_COLORS.map((color) => (
                     <button
                       key={color}
                       onClick={() => setDraftColor(color)}
                       className={cn("w-10 h-10 rounded-full transition-all border border-black/5 shadow-sm", draftColor === color ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-[#F2F2F7]" : "")}
                       style={{ backgroundColor: color }}
                     />
                   ))}
                 </div>
               </div>
            )}

            <div className="mt-8 flex gap-3">
              <button onClick={closeDialog} className="flex-1 h-12 rounded-xl bg-gray-200/80 text-[17px] font-semibold text-blue-600 active:bg-gray-300 transition-colors">
                Cancel
              </button>
              <button onClick={handleSubmitDialog} className="flex-1 h-12 rounded-xl bg-blue-600 text-[17px] font-semibold text-white active:bg-blue-700 transition-colors">
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {menuTarget && <button type="button" className="fixed inset-0 z-30" onClick={() => setMenuTarget(null)} />}
    </div>
  );
}
`;

fs.writeFileSync("src/components/Library.tsx", before + newReturn + after);
console.log("Done");
