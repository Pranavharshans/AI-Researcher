import { File, FileCode2, FolderClosed } from "lucide-react";
import type { ProjectFile } from "@/types/project";

type FileTreeProps = {
  files: ProjectFile[];
  activeFileId: string;
  onSelectFile: (fileId: string) => void;
};

const getFileIcon = (path: string) => {
  if (path.endsWith(".tex")) {
    return <FileCode2 aria-hidden="true" />;
  }

  return <File aria-hidden="true" />;
};

export const FileTree = ({ files, activeFileId, onSelectFile }: FileTreeProps) => {
  const groupedFiles = files.reduce<Record<string, ProjectFile[]>>((groups, file) => {
    const [folder] = file.path.includes("/") ? file.path.split("/") : ["root"];
    groups[folder] = [...(groups[folder] ?? []), file];
    return groups;
  }, {});

  return (
    <nav className="file-tree" aria-label="Project file tree">
      {groupedFiles.root?.map((file) => (
        <button
          className="file-tree-item"
          data-active={file.id === activeFileId}
          key={file.id}
          type="button"
          onClick={() => onSelectFile(file.id)}
        >
          {getFileIcon(file.path)}
          <span>{file.path}</span>
        </button>
      ))}

      {Object.entries(groupedFiles)
        .filter(([folder]) => folder !== "root")
        .map(([folder, folderFiles]) => (
          <div className="file-folder" key={folder}>
            <div className="folder-label">
              <FolderClosed aria-hidden="true" />
              <span>{folder}/</span>
            </div>
            {folderFiles.map((file) => (
              <button
                className="file-tree-item nested"
                data-active={file.id === activeFileId}
                key={file.id}
                type="button"
                onClick={() => onSelectFile(file.id)}
              >
                {getFileIcon(file.path)}
                <span>{file.path.replace(`${folder}/`, "")}</span>
              </button>
            ))}
          </div>
        ))}
    </nav>
  );
};
