---
title: "{{ replace .File.ContentBaseName "-" " " | title }}"
translationKey: "post-{{ .File.ContentBaseName }}"
date: {{ .Date }}
lastmod: {{ .Date }}
tags: []
categories: []
---