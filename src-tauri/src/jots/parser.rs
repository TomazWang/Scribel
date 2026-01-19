use crate::jots::models::{Jot, JotError, JotFrontmatter};
use chrono::{DateTime, Utc};
use regex::Regex;

/// Extract #tags from content
/// Input: "Meeting about #work and #project-x"
/// Output: ["work", "project-x"]
pub fn extract_tags(content: &str) -> Vec<String> {
    // Compile regex on each call (small performance cost, but simple and safe)
    let tag_regex = Regex::new(r"#([a-zA-Z][a-zA-Z0-9_-]*)").expect("Invalid tag regex");

    tag_regex
        .captures_iter(content)
        .map(|cap| cap[1].to_string())
        .collect()
}

/// Extract [[wiki-links]] from content
/// Input: "Check [[Project Notes]] and [[Meeting Log]]"
/// Output: ["Project Notes", "Meeting Log"]
pub fn extract_links(content: &str) -> Vec<String> {
    // Compile regex on each call (small performance cost, but simple and safe)
    let link_regex = Regex::new(r"\[\[([^\]]+)\]\]").expect("Invalid link regex");

    link_regex
        .captures_iter(content)
        .map(|cap| cap[1].to_string())
        .collect()
}

/// Parse jot file into Jot struct
/// Expects YAML frontmatter followed by content
pub fn parse_jot_file(file_content: &str, file_path: &str) -> Result<Jot, JotError> {
    // Split frontmatter from content
    let parts: Vec<&str> = file_content.splitn(3, "---").collect();

    if parts.len() < 3 {
        return Err(JotError::ParseError(
            "Missing frontmatter delimiters".to_string(),
        ));
    }

    let frontmatter_str = parts[1].trim();
    let content = parts[2].trim().to_string();

    // Parse frontmatter
    let frontmatter: JotFrontmatter = serde_yaml::from_str(frontmatter_str)?;

    Ok(Jot {
        id: frontmatter.id,
        content,
        created_at: frontmatter.created,
        modified_at: frontmatter.modified,
        tags: frontmatter.tags,
        links: frontmatter.links,
        promoted: frontmatter.promoted,
        file_path: file_path.to_string(),
    })
}

/// Serialize Jot to markdown with frontmatter
pub fn serialize_jot(jot: &Jot) -> String {
    let frontmatter = JotFrontmatter {
        id: jot.id.clone(),
        created: jot.created_at,
        modified: jot.modified_at,
        tags: jot.tags.clone(),
        links: jot.links.clone(),
        promoted: jot.promoted,
    };

    let yaml = serde_yaml::to_string(&frontmatter).unwrap_or_default();

    format!("---\n{}---\n\n{}", yaml, jot.content)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_extract_tags() {
        let content = "Meeting about #work and #project-x";
        let tags = extract_tags(content);
        assert_eq!(tags, vec!["work", "project-x"]);
    }

    #[test]
    fn test_extract_tags_no_numbers_first() {
        // Tags must start with letter
        let content = "This is #123 and #test";
        let tags = extract_tags(content);
        assert_eq!(tags, vec!["test"]);
    }

    #[test]
    fn test_extract_tags_empty() {
        let content = "No tags here";
        let tags = extract_tags(content);
        assert!(tags.is_empty());
    }

    #[test]
    fn test_extract_links() {
        let content = "Check [[Project Notes]] and [[Meeting Log]]";
        let links = extract_links(content);
        assert_eq!(links, vec!["Project Notes", "Meeting Log"]);
    }

    #[test]
    fn test_extract_links_with_spaces() {
        let content = "See [[Note with Spaces]]";
        let links = extract_links(content);
        assert_eq!(links, vec!["Note with Spaces"]);
    }

    #[test]
    fn test_extract_links_empty() {
        let content = "No links here";
        let links = extract_links(content);
        assert!(links.is_empty());
    }

    #[test]
    fn test_parse_jot_file() {
        let content = r#"---
id: jot-2025-01-19-143256-a1b2
created: 2025-01-19T14:32:56Z
modified: 2025-01-19T14:32:56Z
tags:
  - work
links:
  - Project X
promoted: false
---

Test content"#;

        let jot = parse_jot_file(content, ".scribel/jots/test.md").unwrap();
        assert_eq!(jot.id, "jot-2025-01-19-143256-a1b2");
        assert_eq!(jot.content, "Test content");
        assert_eq!(jot.tags, vec!["work"]);
        assert_eq!(jot.links, vec!["Project X"]);
        assert!(!jot.promoted);
    }

    #[test]
    fn test_serialize_jot() {
        let jot = Jot {
            id: "jot-2025-01-19-143256-a1b2".to_string(),
            content: "Test content".to_string(),
            created_at: "2025-01-19T14:32:56Z".parse::<DateTime<Utc>>().unwrap(),
            modified_at: "2025-01-19T14:32:56Z".parse::<DateTime<Utc>>().unwrap(),
            tags: vec!["work".to_string()],
            links: vec!["Project X".to_string()],
            promoted: false,
            file_path: ".scribel/jots/test.md".to_string(),
        };

        let markdown = serialize_jot(&jot);
        assert!(markdown.starts_with("---\n"));
        assert!(markdown.contains("id: jot-"));
        assert!(markdown.contains("Test content"));
    }

    #[test]
    fn test_parse_invalid_frontmatter() {
        let content = "Invalid content without frontmatter";
        let result = parse_jot_file(content, "test.md");
        assert!(result.is_err());
    }
}
